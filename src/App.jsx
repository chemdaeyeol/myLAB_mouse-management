import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Search,
  History, GripVertical, Rat, CheckCircle2, RotateCcw, Lock, Unlock, MessageCircle, Users, FlaskConical, CalendarDays,
} from "lucide-react";
import { hasConfig, supabase, OWNER_EMAIL } from "./supabaseClient";
import { useTable } from "./db";
import { ConfirmProvider, useConfirm, usePrompt, useScrollLock } from "./ui.jsx";
import { ChatPanel, IntroModal, shouldShowIntro, usePresence, readChatName } from "./Extras.jsx";

/* ---------------- constants ---------------- */
const GROUPS = [
  { key: "chd8", label: "CHD8", icon: Rat },
  { key: "gfap", label: "GFAP x rtTA x 4F2A", icon: Rat },
  { key: "behavior", label: "Behavior Test · IHC", icon: Rat },
];
const CAGE_TYPES = {
  mating: { label: "Mating", color: "#0071E3" },
  dox: { label: "DOX", color: "#C2610B" },
  behavior: { label: "Behavior", color: "#7A3FBF" },
  ihc: { label: "IHC", color: "#0F7C8A" },
  other: { label: "기타", color: "#86868B" },
};
// 실험 상태 태그 (여러 개 동시 선택 가능)
const EXP_TAGS = [
  { key: "genotyping", label: "Genotyping",  color: "#8A5316", bg: "#FDF3E3" },
  { key: "tam",        label: "TAM Treatment",    color: "#5B37A7", bg: "#EFEAFB" },
  { key: "dox",        label: "DOX Treatment",    color: "#12509B", bg: "#E8F1FD" },
  { key: "weaning",    label: "DOX 예정",    color: "#166B3C", bg: "#E8F6ED" },
  { key: "waiting",    label: "실험 대기",    color: "#5A6470", bg: "#EFF1F4" },
];
const tagInfo = (k) => EXP_TAGS.find((t) => t.key === k);
// tags 는 항상 배열로 다룬다 (문자열/널로 와도 안전하게)
const asTags = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.replace(/[{}"]/g, "").split(",").filter(Boolean);
  return [];
};
// 첫 번째 태그 색으로 카드 테두리를 은은하게
// 카드 자체에는 색을 넣지 않는다 (상태는 오른쪽 배지로만 표시)
const tagStyle = () => undefined;

const GENO_TIP = {
  HM: "Homozygous",
  HT: "Heterozygous",
  WT: "Wild type",
  O: "Positive",
  X: "Negative",
};
const genoTip = (v) => GENO_TIP[(v || "").toUpperCase()] || v;

const DOX_STATUS = { 완료: "#1D8C4B", 진행중: "#C2610B", 예정: "#98989D" };

// 본문 패널 바깥(여백/화면 가장자리)인지 — 여기로 던지면 삭제
function isOutsidePanel(x, y) {
  const panel = document.querySelector(".app");
  const vw = window.innerWidth, vh = window.innerHeight;
  if (panel) {
    const r = panel.getBoundingClientRect();
    const sideMargin = r.left > 12 || r.right < vw - 12;
    if (sideMargin && (x < r.left + 18 || x > r.right - 18)) return true;
  }
  return x < 30 || x > vw - 30 || y < 30 || y > vh - 30;
}

// 배열을 from → to 로 옮기고, sort 값을 0..n 으로 다시 매겨 저장
async function persistOrder(list, from, to, table) {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  await Promise.all(next.map((r, i) => (r.sort === i ? null : supabase.from(table).update({ sort: i }).eq("id", r.id))));
  return next;
}

/* ---------------- date helpers ---------------- */
// "25.03.27", "26.01.16~18", "2026.7.23~24" 등 → 첫 날짜만 파싱
function parseDob(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return null;
  let y = Number(m[1]); if (y < 100) y += 2000;
  const d = new Date(y, Number(m[2]) - 1, Number(m[3]));
  return isNaN(d) ? null : d;
}
function ageWeeks(dobStr) {
  const d = parseDob(dobStr); if (!d) return null;
  const w = Math.floor((Date.now() - d.getTime()) / (7 * 86400000));
  return w >= 0 && w < 400 ? w : null;
}
// 표시 단위: auto → w → m → y (배지 클릭으로 순환)
const AGE_UNITS = ["w", "m", "y"];
const AGE_KEY = "mc_age_unit";
export const AgeUnitCtx = createContext({ unit: "m", cycle: () => {} });
export const EditCtx = createContext(false);

const ageBadge = (w, unit = "m") => {
  if (w == null) return null;
  if (unit === "w") return `${w}w`;
  if (unit === "y") return `${(w / 52.14).toFixed(1)}y`;
  return `${Math.floor(w / 4.345)}m`;
};

/* ---------------- small UI ---------------- */
function Field({ label, children }) {
  return <label className="field"><span className="flabel">{label}</span>{children}</label>;
}

function MouseForm({ init, cage, onSave, onCancel }) {
  const [f, setF] = useState({
    label: init?.label || "", g1: init?.g1 || "", g2: init?.g2 || "", g3: init?.g3 || "",
    dob: init?.dob || "", note: init?.note || "", weight: init?.weight || "", dose: init?.dose || "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <tr className="form-row">
      <td colSpan={7}>
        <div className="mform">
          <Field label="Mouse"><input className="in" value={f.label} onChange={set("label")} placeholder="M1 / F5 / baby" autoFocus /></Field>
          <Field label={cage.g1_label || "G1"}><input className="in" value={f.g1} onChange={set("g1")} placeholder="HM/HT/WT/O/X" /></Field>
          <Field label={cage.g2_label || "G2"}><input className="in" value={f.g2} onChange={set("g2")} placeholder="O/X/HT" /></Field>
          <Field label={cage.g3_label || "G3"}><input className="in" value={f.g3} onChange={set("g3")} placeholder="O/X/HM" /></Field>
          <Field label="DOB"><input className="in" value={f.dob} onChange={set("dob")} placeholder="26.05.18" /></Field>
          <Field label="무게"><input className="in" value={f.weight} onChange={set("weight")} placeholder="14.5g" /></Field>
          <Field label="비고"><input className="in wide" value={f.note} onChange={set("note")} placeholder="tdT HM로 교체필요 / IHC-14" /></Field>
          <div className="mform-actions">
            <button className="btn btn-s" onClick={onCancel}><X size={14} /> 취소</button>
            <button className="btn btn-p" onClick={() => onSave(f)}><Check size={14} /> 저장</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function MouseRow({ m, idx, cage, ops, me, canDrag, isBaby, w, drag, onGrab, setEditing, confirmDelete }) {
  const { unit, cycle } = useContext(AgeUnitCtx);
  const canEdit = useContext(EditCtx);
  const isDragging = drag?.idx === idx;
  const isTarget = drag && drag.mode === "move" && drag.overIdx === idx && drag.idx !== idx;

  return (
    <tr
      className={(isBaby ? "baby" : "") +
        (isDragging ? " swiping" : "") +
        (isDragging && drag.mode === "delete" && drag.armed ? " armed" : "") +
        (isTarget ? (drag.side === "above" ? " drop-above" : " drop-below") : "")}
      style={isDragging ? {
        transform: `translate(${drag.dx}px, ${drag.dy}px) scale(${drag.armed ? 0.97 : 1})`,
      } : undefined}
      data-row={idx} data-cage={cage.id}
      onPointerDown={(e) => canEdit && canDrag && onGrab(e, idx)}>
      <td className="mono strong c">{m.label}</td>
      <td className="c">{m.g1 && <span className={"gchip g-" + (m.g1 || "").toUpperCase()} data-tip={`${cage.g1_label || "G1"} · ${genoTip(m.g1)}`}>{m.g1}</span>}</td>
      <td className="c">{m.g2 && <span className={"gchip g-" + (m.g2 || "").toUpperCase()} data-tip={`${cage.g2_label || "G2"} · ${genoTip(m.g2)}`}>{m.g2}</span>}</td>
      <td className="c">{m.g3 && <span className={"gchip g-" + (m.g3 || "").toUpperCase()} data-tip={`${cage.g3_label || "G3"} · ${genoTip(m.g3)}`}>{m.g3}</span>}</td>
      <td className="mono c dob-cell">
        <span className="dob-wrap">
          <span className="dob-date">{m.dob}</span>
          {ageBadge(w, unit) && (
            <button className="age" title="클릭하면 단위 전환 (주 · 개월 · 년)"
              onClick={(e) => { e.stopPropagation(); cycle(); }}
              onPointerDown={(e) => e.stopPropagation()}>{ageBadge(w, unit)}</button>
          )}
        </span>
      </td>
      <td className="note c">{m.note}{m.weight ? <span className="wt">{m.weight}</span> : null}</td>
      <td className="row-actions">
        {canEdit && <>
          <button className="iconbtn" title="수정" onClick={() => setEditing(m.id)}
            onPointerDown={(e) => e.stopPropagation()}><Pencil size={13} /></button>
          <button className="iconbtn danger" title="삭제" onClick={() => confirmDelete(m)}
            onPointerDown={(e) => e.stopPropagation()}><Trash2 size={13} /></button>
        </>}
      </td>
    </tr>
  );
}

/* ---------------- 투여 스케줄 ---------------- */
// yy.MM.dd 형식 (기존 표기와 동일)
const p2 = (n) => String(n).padStart(2, "0");
const fmtDay = (d) => `${p2(d.getFullYear() % 100)}.${p2(d.getMonth() + 1)}.${p2(d.getDate())}`;
const fmtRange = (a, b) => {
  if (a.getTime() === b.getTime()) return fmtDay(a);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())
    return `${fmtDay(a)}~${p2(b.getDate())}`;              // 26.09.08~10
  return `${fmtDay(a)}~${p2(b.getMonth() + 1)}.${p2(b.getDate())}`;  // 26.09.28~10.02
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// 투여 n일 / 휴식 m일 패턴으로 Cycle 날짜를 계산
function buildCycles({ start, on, off, times }) {
  const s0 = new Date(start + "T00:00:00");
  if (isNaN(s0) || on < 1 || times < 1) return [];
  const out = [];
  for (let i = 0; i < times; i++) {
    const a = addDays(s0, i * (on + off));
    const b = addDays(a, on - 1);
    out.push({ dates: fmtRange(a, b), start: a, end: b });
  }
  return out;
}

// Cycle 자동 생성 폼
function CycleGen({ sched, count, onCreate }) {
  const [g, setG] = useState({ start: "", on: 3, off: 2, times: 6, dose: "0.15mg", label: "{n}차" });
  const [busy, setBusy] = useState(false);
  const preview = buildCycles({ start: g.start, on: +g.on, off: +g.off, times: +g.times });

  return (
    <div className="gen">
      <div className="gen-row">
        <label className="gen-f"><span>시작일</span>
          <input className="in" type="date" value={g.start}
            onChange={(e) => setG({ ...g, start: e.target.value })} /></label>
        <label className="gen-f sm"><span>투여</span>
          <input className="in" type="number" min="1" value={g.on}
            onChange={(e) => setG({ ...g, on: e.target.value })} /><i>일</i></label>
        <label className="gen-f sm"><span>휴식</span>
          <input className="in" type="number" min="0" value={g.off}
            onChange={(e) => setG({ ...g, off: e.target.value })} /><i>일</i></label>
        <label className="gen-f sm"><span>반복</span>
          <input className="in" type="number" min="1" value={g.times}
            onChange={(e) => setG({ ...g, times: e.target.value })} /><i>회</i></label>
        <label className="gen-f"><span>농도</span>
          <input className="in" value={g.dose} placeholder="0.15mg"
            onChange={(e) => setG({ ...g, dose: e.target.value })} /></label>
        <label className="gen-f"><span>이름 형식</span>
          <input className="in" value={g.label} placeholder="{n}차"
            onChange={(e) => setG({ ...g, label: e.target.value })} /></label>
      </div>

      {preview.length > 0 && (
        <div className="gen-prev">
          <span className="gen-prev-t">미리보기 {preview.length}개</span>
          {preview.slice(0, 8).map((c, i) => <span key={i} className="gen-chip mono">{c.dates}</span>)}
          {preview.length > 8 && <span className="gen-chip more">＋{preview.length - 8}</span>}
        </div>
      )}

      <button className="btn btn-p" disabled={!preview.length || busy}
        onClick={async () => {
          setBusy(true);
          await onCreate(preview.map((c, i) => ({
            cycle: (g.label || "{n}차").replace("{n}", String(count + i + 1)),
            dates: c.dates, dose: g.dose.trim(),
            status: "예정", sort: count + i + 1,
          })));
          setBusy(false);
        }}>
        <Plus size={14} /> {busy ? "생성 중…" : `Cycle ${preview.length}개 생성`}
      </button>
    </div>
  );
}

const SCHED_STATUS = ["예정", "진행중", "완료"];
const statusClass = (st) => (st === "완료" ? "s-done" : st === "진행중" ? "s-run" : "s-plan");

// 상태 배지: 클릭하면 예정·진행중·완료를 직접 선택
function StatusBadge({ value, onChange, disabled }) {
  const [pos, setPos] = useState(null);   // 열려 있으면 {top,left}
  const btnRef = useRef(null);

  const openMenu = () => {
    if (disabled) return;
    const r = btnRef.current.getBoundingClientRect();
    const H = 132;                                   // 메뉴 대략 높이
    const below = window.innerHeight - r.bottom > H + 12;
    setPos({ top: below ? r.bottom + 7 : r.top - H - 7, left: r.left });
  };

  return (
    <span className="stat-wrap">
      <button ref={btnRef} className={"dstat " + statusClass(value)} disabled={disabled}
        onClick={() => (pos ? setPos(null) : openMenu())}>{value}</button>
      {pos && createPortal(
        <>
          <div className="menu-back" onClick={() => setPos(null)} />
          <div className="statmenu fixed" style={{ top: pos.top, left: pos.left }}>
            {SCHED_STATUS.map((st) => (
              <button key={st} className={"statmenu-item" + (st === value ? " on" : "")}
                onClick={() => { setPos(null); if (st !== value) onChange(st); }}>
                <span className={"dstat " + statusClass(st)}>{st}</span>
                {st === value && <Check size={14} className="tagmenu-check" />}
              </button>
            ))}
          </div>
        </>, document.body)}
    </span>
  );
}

// 케이지에 배정된 스케줄: 접힌 요약 → 클릭하면 회차 펼침
function CageSched({ cage, scheds, cycles, ops, me }) {
  const canEdit = useContext(EditCtx);
  const [open, setOpen] = useState(false);
  const sched = scheds.find((x) => x.id === cage.sched_id);
  if (!sched) return null;

  const mine = cycles.filter((r) => r.sched_id === sched.id);
  const done = mine.filter((r) => r.status === "완료").length;
  const cur = mine.find((r) => r.status === "진행중");
  const next = mine.find((r) => r.status === "예정");

  return (
    <div className="csched">
      <button className="csched-bar" onClick={() => setOpen((v) => !v)}>
        <span className="csched-kind">{sched.kind}</span>
        <b>{sched.name}</b>
        <span className="csched-sum">
          완료 {done}/{mine.length}
          {cur ? ` · 진행 중 ${cur.dates}` : next ? ` · 다음 ${next.dates}` : ""}
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="csched-list">
          {mine.length === 0 && <p className="muted" style={{ margin: "6px 2px" }}>등록된 Cycle이 없어요.</p>}
          {mine.map((r) => (
            <div key={r.id} className="csched-row">
              <StatusBadge value={r.status} disabled={!canEdit}
                onChange={(st) => ops.update(r.id, { status: st }, me, `${sched.name} ${r.cycle} → ${st}`)} />
              <span className="csched-cycle">{r.cycle}</span>
              <span className="mono csched-date">{r.dates}</span>
              {r.dose && <span className="sched-dose">{r.dose}</span>}
              {r.note && <span className="sched-note">{r.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 스케줄 관리: 목록 · 회차 편집 · 케이지 배정
function SchedLibrary({ me, scheds, schedOps, cycles, cycleOps, cages, cageOps, onClose }) {
  const canEdit = useContext(EditCtx);
  const confirm = useConfirm();
  const askText = usePrompt();
  const [expand, setExpand] = useState(null);
  const [f, setF] = useState({ cycle: "", dates: "", dose: "", note: "" });
  const [edit, setEdit] = useState(null);
  const [ef, setEf] = useState({ cycle: "", dates: "", dose: "" });
  const [rename, setRename] = useState(null);
  const [rf, setRf] = useState({ name: "", kind: "DOX" });
  useScrollLock(true);

  const addSched = async () => {
    const name = await askText({ title: "새 투여 스케줄", body: "스케줄 이름을 입력하세요.", placeholder: "예: DOX 0.15mg 3일 사이클", okText: "만들기" });
    if (name) await schedOps.add({ name, kind: "DOX" }, me, `스케줄 ${name} 생성`);
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal lib-modal" role="dialog" aria-modal="true">
        <div className="lib-modal-head">
          <CalendarDays size={17} />
          <b>투여 스케줄</b>
          <span className="dox-sum">{scheds.length}개 · 해당하는 케이지에 배정</span>
          <button className="iconbtn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="lib-modal-body">
          {scheds.length === 0 && <p className="muted" style={{ padding: "10px 2px" }}>등록된 스케줄이 없어요.</p>}
          {scheds.map((sc) => {
            const mine = cycles.filter((r) => r.sched_id === sc.id);
            const applied = cages.filter((c) => c.sched_id === sc.id);
            const on = expand === sc.id;
            return (
              <div key={sc.id} className="lib-item">
                {rename === sc.id ? (
                  <div className="lib-head" onClick={(e) => e.stopPropagation()}>
                    <select className="in" style={{ maxWidth: 96 }} value={rf.kind}
                      onChange={(e) => setRf({ ...rf, kind: e.target.value })}>
                      {["DOX", "TAM", "기타"].map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input className="in" autoFocus value={rf.name} placeholder="스케줄 이름"
                      onChange={(e) => setRf({ ...rf, name: e.target.value })}
                      onKeyDown={async (e) => {
                        if (e.key === "Escape") setRename(null);
                        if (e.key === "Enter" && rf.name.trim()) {
                          await schedOps.update(sc.id, { name: rf.name.trim(), kind: rf.kind }, me, `스케줄 ${rf.name} 수정`);
                          setRename(null);
                        }
                      }} />
                    <button className="btn btn-s" onClick={() => setRename(null)}><X size={14} /></button>
                    <button className="btn btn-p" disabled={!rf.name.trim()}
                      onClick={async () => {
                        await schedOps.update(sc.id, { name: rf.name.trim(), kind: rf.kind }, me, `스케줄 ${rf.name} 수정`);
                        setRename(null);
                      }}><Check size={14} /> 저장</button>
                  </div>
                ) : (
                <div className="lib-head" onClick={() => setExpand(on ? null : sc.id)}>
                  <span className="csched-kind">{sc.kind}</span>
                  <b>{sc.name}</b>
                  <span className="dox-sum">Cycle {mine.length} · 적용 {applied.length}개 케이지</span>
                  {canEdit && (
                    <span className="lib-act">
                      <button className="iconbtn" title="이름 수정"
                        onClick={(e) => { e.stopPropagation(); setRename(sc.id); setRf({ name: sc.name || "", kind: sc.kind || "DOX" }); }}>
                        <Pencil size={14} /></button>
                      <button className="iconbtn danger" title="스케줄 삭제"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm({ title: "스케줄을 삭제할까요?", body: `${sc.name} · Cycle ${mine.length}건이 함께 삭제됩니다.` });
                          if (ok) await schedOps.remove(sc.id, me, `스케줄 ${sc.name} 삭제`);
                        }}><Trash2 size={14} /></button>
                    </span>
                  )}
                  {on ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
                )}

                {on && (
                  <div className="lib-body">
                    <div className="lib-sub">Cycle</div>
                    {mine.map((r) => (
                      edit === r.id ? (
                        <div key={r.id} className="sched-form">
                          <input className="in" style={{ maxWidth: 96 }} value={ef.cycle} autoFocus
                            placeholder="1차" onChange={(e) => setEf({ ...ef, cycle: e.target.value })} />
                          <input className="in" style={{ maxWidth: 160 }} value={ef.dates}
                            placeholder="26.09.08~10" onChange={(e) => setEf({ ...ef, dates: e.target.value })} />
                          <input className="in" style={{ maxWidth: 104 }} value={ef.dose}
                            placeholder="0.15mg" onChange={(e) => setEf({ ...ef, dose: e.target.value })} />
                          <button className="btn btn-s" onClick={() => setEdit(null)}><X size={14} /></button>
                          <button className="btn btn-p" onClick={async () => {
                            await cycleOps.update(r.id, {
                              cycle: ef.cycle.trim(), dates: ef.dates.trim(), dose: ef.dose.trim(),
                            }, me, `${sc.name} ${ef.cycle} 수정`);
                            setEdit(null);
                          }}><Check size={14} /> 저장</button>
                        </div>
                      ) : (
                        <div key={r.id} className="csched-row">
                          <StatusBadge value={r.status} disabled={!canEdit}
                            onChange={(st) => cycleOps.update(r.id, { status: st }, me, `${sc.name} ${r.cycle} → ${st}`)} />
                          <span className="csched-cycle">{r.cycle}</span>
                          <span className="mono csched-date">{r.dates}</span>
                          {r.dose && <span className="sched-dose">{r.dose}</span>}
                          {canEdit && (
                            <span className="csched-act">
                              <button className="iconbtn" title="수정"
                                onClick={() => { setEdit(r.id); setEf({ cycle: r.cycle || "", dates: r.dates || "", dose: r.dose || "" }); }}>
                                <Pencil size={13} /></button>
                              <button className="iconbtn danger" title="삭제"
                                onClick={() => cycleOps.remove(r.id, me, `${sc.name} ${r.cycle} 삭제`)}><Trash2 size={13} /></button>
                            </span>
                          )}
                        </div>
                      )
                    ))}
                    {canEdit && (
                      <>
                        <div className="lib-sub">Cycle 자동 생성</div>
                        <CycleGen sched={sc} count={mine.length}
                          onCreate={async (rows) => {
                            for (const r of rows) await cycleOps.add({ ...r, sched_id: sc.id }, me, `${sc.name} Cycle 자동 생성`);
                          }} />
                        <div className="lib-sub">직접 추가</div>
                      </>
                    )}

                    {canEdit && (
                      <div className="sched-form">
                        <input className="in" style={{ maxWidth: 88 }} placeholder="1차" value={f.cycle}
                          onChange={(e) => setF({ ...f, cycle: e.target.value })} />
                        <input className="in" style={{ maxWidth: 160 }} placeholder="26.09.08~10" value={f.dates}
                          onChange={(e) => setF({ ...f, dates: e.target.value })} />
                        <input className="in" style={{ maxWidth: 104 }} placeholder="0.15mg" value={f.dose}
                          onChange={(e) => setF({ ...f, dose: e.target.value })} />
                        <button className="btn btn-p" disabled={!f.dates.trim() && !f.cycle.trim()}
                          onClick={async () => {
                            await cycleOps.add({
                              sched_id: sc.id, cycle: f.cycle.trim() || `${mine.length + 1}차`,
                              dates: f.dates.trim(), dose: f.dose.trim(), note: f.note.trim(),
                              status: "예정", sort: mine.length + 1,
                            }, me, `${sc.name} Cycle 추가`);
                            setF({ cycle: "", dates: "", dose: "", note: "" });
                          }}><Plus size={14} /> Cycle 추가</button>
                      </div>
                    )}

                    {canEdit && (
                      <>
                        <div className="lib-sub">적용 케이지</div>
                        <div className="lib-cages">
                          {cages.map((c) => {
                            const checked = c.sched_id === sc.id;
                            return (
                              <label key={c.id} className={"lib-cage" + (checked ? " on" : "")}>
                                <input type="checkbox" checked={checked}
                                  onChange={() => cageOps.update(c.id, { sched_id: checked ? null : sc.id }, me,
                                    `케이지 ${c.label} · ${sc.name} ${checked ? "해제" : "배정"}`)} />
                                {c.label}
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {canEdit && <button className="sched-add" onClick={addSched}><Plus size={14} /> 새 스케줄</button>}
        </div>
      </div>
    </div>
  );
}

function CageCard({ cage, mice, ops, cageOps, me, q, dragCage, doxRows, doxOps, scheds }) {
  const confirm = useConfirm();
  const canEdit = useContext(EditCtx);
  const deleteCage = async () => {
    const ok = await confirm({
      title: "케이지를 삭제할까요?",
      body: `${cage.label} · 소속 mouse ${mice.length}마리가 함께 삭제됩니다.`,
    });
    if (ok) await cageOps.remove(cage.id, me, `케이지 ${cage.label}`);
    return ok;
  };
  const [open, setOpen] = useState(!cage.done);
  const [editing, setEditing] = useState(null); // id | 'new'
  const [editCage, setEditCage] = useState(false);
  const [tagMenu, setTagMenu] = useState(null);
  const tagBtnRef = useRef(null);
  const [drag, setDrag] = useState(null); // {idx,dx,dy,mode,overIdx,side}
  const dragRef = useRef(null);
  const [cf, setCf] = useState({ label: cage.label, note: cage.note || "", type: cage.type });
  const t = CAGE_TYPES[cage.type] || CAGE_TYPES.other;

  const list = useMemo(() => {
    if (!q) return mice;
    const s = q.toLowerCase();
    return mice.filter((m) => [m.label, m.g1, m.g2, m.g3, m.dob, m.note].join(" ").toLowerCase().includes(s));
  }, [mice, q]);

  const counts = useMemo(() => {
    let male = 0, female = 0, baby = 0;
    mice.forEach((m) => {
      const L = (m.label || "").toUpperCase();
      if (L.startsWith("BABY")) baby++;
      else if (L.startsWith("M")) male++;
      else if (L.startsWith("F")) female++;
    });
    return { male, female, baby, total: mice.length - baby };
  }, [mice]);

  const confirmDelete = async (mouse) => {
    const ok = await confirm({
      title: "Mouse를 삭제할까요?",
      body: `${cage.label} · ${mouse.label || "이름 없음"}`,
    });
    if (ok) await ops.remove(mouse.id, me, `${cage.label} / ${mouse.label}`);
    return ok;
  };

  // 행 아무 곳이나 잡아서: 위아래로 옮기면 순서 변경 / 멀리 던지면 삭제
  const onGrab = (e, idx) => {
    if (e.button === 1 || e.button === 2) return;
    if (e.target.closest("button,input,select,textarea,a")) return;
    const touch = e.pointerType === "touch" || window.matchMedia("(hover: none)").matches;
    if (touch) return;   // 모바일은 표 가로 스크롤 우선 (삭제는 휴지통 버튼으로)
    const st = { idx, x: e.clientX, y: e.clientY, active: false, mode: "move",
      overIdx: null, side: "above", touch };
    dragRef.current = st;

    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.classList.remove("dragging-row");
      setDrag(null);
    };

    const move = (ev) => {
      const d = dragRef.current; if (!d) return;
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
      if (!d.active) {
        if (d.touch) {
          // 모바일: 세로로 움직이면 페이지 스크롤에 양보, 가로일 때만 시작
          if (Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; cleanup(); return; }
          if (Math.abs(dx) < 14) return;
        } else if (Math.hypot(dx, dy) < 8) return;
        d.active = true;
        document.body.classList.add("dragging-row");
      }
      ev.preventDefault();
      // 모바일은 항상 '스와이프 삭제'
      const far = d.touch
        ? Math.abs(dx) > 96 || isOutsidePanel(ev.clientX, ev.clientY)
        : isOutsidePanel(ev.clientX, ev.clientY) || Math.abs(dx) > 150;
      d.mode = d.touch ? "delete" : (far ? "delete" : "move");
      d.overIdx = null;
      if (!d.touch && !far) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const tr = el && el.closest("tr[data-row]");
        if (tr && tr.dataset.cage === cage.id) {
          const ti = Number(tr.dataset.row);
          const r = tr.getBoundingClientRect();
          d.overIdx = ti;
          d.side = ev.clientY < r.top + r.height / 2 ? "above" : "below";
        }
      }
      d.lastDx = dx; d.wasOutside = isOutsidePanel(ev.clientX, ev.clientY);
      setDrag({ idx: d.idx, dx, dy: d.touch ? 0 : dy, mode: d.mode, overIdx: d.overIdx, side: d.side, armed: far });
    };

    const up = async () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const d = dragRef.current; dragRef.current = null;
      document.body.classList.remove("dragging-row");
      if (!d || !d.active) { setDrag(null); return; }

      if (d.mode === "delete") {
        const dx = d.lastDx || 0;
        const armed = d.touch
          ? Math.abs(dx) > 96 || d.wasOutside
          : true;
        setDrag(null);
        if (armed) await confirmDelete(list[d.idx]);
        return;
      }
      if (d.overIdx != null && d.overIdx !== d.idx) {
        const from = d.idx;
        let to = d.side === "below" ? d.overIdx + 1 : d.overIdx;
        if (from < to) to -= 1;
        setDrag(null);
        if (from !== to) { await persistOrder(mice, from, to, "mc_mice"); await ops.reload(); }
        return;
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
  };

  // 훅 호출이 모두 끝난 뒤에 조건부 렌더링
  if (q && list.length === 0) return null;

  return (
    <div style={tagStyle(cage.tags)}
      className={"cage" + (cage.done ? " done" : "") + (asTags(cage.tags).length ? " tagged" : "") + (dragCage?.isDragging ? " dragging" : "") +
      (dragCage?.isOver ? (dragCage.side === "above" ? " drop-above" : " drop-below") : "")}
      onDragOver={dragCage?.onDragOver} onDrop={dragCage?.onDrop} onDragLeave={dragCage?.onDragLeave}>
      <div className="cage-head">
        {canEdit && (
          <span className="handle" title="드래그해서 케이지 순서 변경"
            draggable onDragStart={dragCage?.onDragStart} onDragEnd={dragCage?.onDragEnd}><GripVertical size={15} /></span>
        )}
        <span className="ctype" style={{ background: t.color }}>{t.label}</span>
        {editCage ? (
          <div className="cage-edit">
            <input className="in" value={cf.label} onChange={(e) => setCf({ ...cf, label: e.target.value })} />
            <input className="in wide" value={cf.note} onChange={(e) => setCf({ ...cf, note: e.target.value })} placeholder="비고 (CNT Cage 1 등)" />
            <select className="in" value={cf.type} onChange={(e) => setCf({ ...cf, type: e.target.value })}>
              {Object.keys(CAGE_TYPES).map((k) => <option key={k} value={k}>{CAGE_TYPES[k].label}</option>)}
            </select>
            <button className="btn btn-s" onClick={() => setEditCage(false)}><X size={14} /></button>
            <button className="btn btn-p" onClick={async () => { await cageOps.update(cage.id, cf, me, `케이지 ${cf.label}`); setEditCage(false); }}><Check size={14} /></button>
          </div>
        ) : (
          <>
            <h3 className="cage-title">{cage.label}</h3>
            {cage.note && <span className="cage-note">{cage.note}</span>}
            <span className="cage-counts">
              ♂{counts.male} · ♀{counts.female}{counts.baby ? " · baby O" : ""} · 총 {counts.total}
            </span>
            <span className="cage-status">
              {asTags(cage.tags).map((k) => {
                const t = tagInfo(k); if (!t) return null;
                return <span key={k} className="tag-badge" style={{ color: t.color, background: t.bg, borderColor: t.color + "40" }}>{t.label}</span>;
              })}
              {cage.done && <span className="done-badge"><CheckCircle2 size={12} /> 완료</span>}
            </span>
            <span className="cage-actions">
              {canEdit && (
                <span className="tagmenu-wrap">
                  <button ref={tagBtnRef} className={"iconbtn" + (asTags(cage.tags).length ? " on" : "")}
                    title="실험 상태 선택"
                    onClick={() => {
                      if (tagMenu) return setTagMenu(null);
                      const r = tagBtnRef.current.getBoundingClientRect();
                      const H = 230;
                      const below = window.innerHeight - r.bottom > H + 12;
                      setTagMenu({ top: below ? r.bottom + 8 : r.top - H - 8, left: Math.max(12, r.right - 186) });
                    }}>
                    <FlaskConical size={14} />
                  </button>
                  {tagMenu && createPortal(
                    <>
                      <div className="menu-back" onClick={() => setTagMenu(null)} />
                      <div className="tagmenu fixed" style={{ top: tagMenu.top, left: tagMenu.left }}>
                        <div className="tagmenu-t">실험 상태</div>
                        {EXP_TAGS.map((t) => {
                          const on = asTags(cage.tags).includes(t.key);
                          return (
                            <button key={t.key} className={"tagmenu-item" + (on ? " on" : "")}
                              onClick={() => {
                                const cur = asTags(cage.tags);
                                const next = on ? cur.filter((x) => x !== t.key) : [...cur, t.key];
                                cageOps.update(cage.id, { tags: next }, me,
                                  `케이지 ${cage.label} · ${t.label} ${on ? "해제" : "설정"}`);
                              }}>
                              <span className="tagmenu-dot" style={{ background: t.color }} />
                              {t.label}
                              {on && <Check size={14} className="tagmenu-check" />}
                            </button>
                          );
                        })}
                      </div>
                    </>, document.body)}
                </span>
              )}
              {canEdit && cage.grp === "behavior" && (
                <button className="iconbtn" title={cage.done ? "완료 취소" : "실험 완료로 표시"}
                  onClick={() => cageOps.update(cage.id, { done: !cage.done, done_at: cage.done ? null : new Date().toISOString() },
                    me, `케이지 ${cage.label} ${cage.done ? "완료 취소" : "실험 완료"}`)}>
                  {cage.done ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                </button>
              )}
              {canEdit && <>
                <button className="iconbtn" title="케이지 수정" onClick={() => setEditCage(true)}><Pencil size={14} /></button>
                <button className="iconbtn danger" title="케이지 삭제" onClick={deleteCage}><Trash2 size={14} /></button>
              </>}
              <button className="iconbtn" onClick={() => setOpen((v) => !v)}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            </span>
          </>
        )}
      </div>

      {open && (
        <div className="tscroll"><table className="mtable">
          <thead>
            <tr>
              <th className="c" style={{ width: "11%" }}>Mouse</th>
              <th className="c" style={{ width: "11%" }}>{cage.g1_label || "G1"}</th>
              <th className="c" style={{ width: "11%" }}>{cage.g2_label || "G2"}</th>
              <th className="c" style={{ width: "11%" }}>{cage.g3_label || "G3"}</th>
              <th className="c" style={{ width: "20%" }}>DOB</th>
              <th className="c">비고</th>
              <th style={{ width: "72px" }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((m, idx) => {
              if (editing === m.id) {
                return <MouseForm key={m.id} init={m} cage={cage} onCancel={() => setEditing(null)}
                  onSave={async (f) => { await ops.update(m.id, f, me, `${cage.label} / ${f.label}`); setEditing(null); }} />;
              }
              const w = ageWeeks(m.dob);
              const isBaby = (m.label || "").toUpperCase().startsWith("BABY");
              const canDrag = !q;
              return (
                <MouseRow key={m.id} m={m} idx={idx} cage={cage} ops={ops} me={me} canDrag={canDrag}
                  isBaby={isBaby} w={w} drag={drag} onGrab={onGrab}
                  setEditing={setEditing} confirmDelete={confirmDelete} />
              );
            })}
            {editing === "new" && (
              <MouseForm cage={cage} onCancel={() => setEditing(null)}
                onSave={async (f) => { await ops.add({ ...f, cage_id: cage.id, sort: mice.length + 1 }, me, `${cage.label} / ${f.label}`); setEditing(null); }} />
            )}
          </tbody>
        </table></div>
      )}

      {open && canEdit && editing !== "new" && (
        <button className="add-row" onClick={() => setEditing("new")}><Plus size={14} /> Mouse 추가</button>
      )}

      {open && <CageSched cage={cage} scheds={scheds} cycles={doxRows} ops={doxOps} me={me} />}
    </div>
  );
}

/* ---------------- DOX schedule ---------------- */
/* ---------------- app ---------------- */
function AppInner() {
  const [grp, setGrp] = useState("chd8");
  const [q, setQ] = useState("");
  const me = "";
  const [showLog, setShowLog] = useState(false);
  const [cDrag, setCDrag] = useState(null);
  const [cOver, setCOver] = useState(null);
  const [cSide, setCSide] = useState("above");
  const askText = usePrompt();
  const [showDone, setShowDone] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [intro, setIntro] = useState(() => shouldShowIntro());
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(t); }, []);
  const people = usePresence(readChatName(), canEdit);
  useEffect(() => {
    if (!hasConfig) return;
    supabase.auth.getSession().then(({ data }) => setCanEdit(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setCanEdit(!!sess));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    document.body.classList.toggle("can-edit", canEdit);
  }, [canEdit]);
  const toggleEdit = async () => {
    if (canEdit) { await supabase.auth.signOut(); return; }
    const pw = await askText({ title: "편집 모드", body: "관리자 비밀번호를 입력하세요.", placeholder: "비밀번호", okText: "확인", password: true });
    if (!pw) return;
    const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: pw });
    if (error) alert("비밀번호가 올바르지 않아요.");
  };
  const [ageUnit, setAgeUnit] = useState(() => {
    const v = (() => { try { return localStorage.getItem(AGE_KEY); } catch { return null; } })();
    return AGE_UNITS.includes(v) ? v : "m";
  });
  const cycleAge = () => setAgeUnit((u) => {
    const next = AGE_UNITS[(AGE_UNITS.indexOf(u) + 1) % AGE_UNITS.length];
    try { localStorage.setItem(AGE_KEY, next); } catch { /* noop */ }
    return next;
  });
  const [cages, cageOps] = useTable("mc_cages", ["grp", "sort"]);
  const [mice, ops] = useTable("mc_mice", ["cage_id", "sort"]);
  const [doxRows, doxOps] = useTable("mc_dox", ["sort"]);
  const [scheds, schedOps] = useTable("mc_sched", ["created_at"]);
  const [logs] = useTable("mc_log", []);


  if (!hasConfig) {
    return <div className="cfg"><h1>환경 변수가 필요해요</h1>
      <pre>{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}</pre></div>;
  }

  const allG = cages.filter((c) => c.grp === grp);
  const doneCages = grp === "behavior" ? allG.filter((c) => c.done) : [];
  const gCages = grp === "behavior" ? allG.filter((c) => !c.done) : allG;
  const byCage = {};
  mice.forEach((m) => { (byCage[m.cage_id] = byCage[m.cage_id] || []).push(m); });
  const totalMice = gCages.reduce((n, c) => n + (byCage[c.id]?.length || 0), 0);
  const recentLogs = [...logs].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 12);

  const addCage = async () => {
    const label = await askText({
      title: "새 케이지 추가",
      body: "케이지 이름을 입력하세요.",
      placeholder: "예: 15, GL7, IHC-14",
      okText: "추가",
    });
    if (!label) return;
    const proto = gCages[gCages.length - 1];
    await cageOps.add({
      grp, label, type: grp === "behavior" ? "ihc" : "mating", note: "",
      g1_label: proto?.g1_label || "", g2_label: proto?.g2_label || "", g3_label: proto?.g3_label || "",
      sort: gCages.length + 1,
    }, me, `케이지 ${label}`);
  };

  return (
    <AgeUnitCtx.Provider value={{ unit: ageUnit, cycle: cycleAge }}>
    <EditCtx.Provider value={canEdit}>
    <div className="app">
      <header className="top">
        <div className="wrap top-in">
          <div>
            <h1>Mouse Management</h1>
            <p className="sub">Mouse Cage & Mouse list (LIVE UPDATE)</p>
          </div>
          <div className="who">
            <span className="clock" title="현재 시각">
              {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
              {" ("}{now.toLocaleDateString("ko-KR", { weekday: "short" }).replace("요일", "")}{") "}
              {now.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true })}
            </span>
            <span className={"presence" + (people.length ? "" : " off")}
              title={people.length ? people.map((p) => p.name + (p.editor ? " (편집 중)" : "")).join(", ") : "실시간 연결 중"}>
              <span className="dot-live" /> <Users size={13} />
              {people.length ? `${people.length}명 접속` : "연결 중"}
            </span>
            <button className={"btn " + (canEdit ? "btn-p" : "btn-s")} onClick={toggleEdit}>
              {canEdit ? <><Unlock size={14} /> 편집 중</> : <><Lock size={14} /> 편집</>}
            </button>
            <button className="btn btn-s" onClick={() => setShowLog((v) => !v)}><History size={14} /> 변경 기록</button>
          </div>
        </div>
      </header>


      {showLog && (
        <div className="wrap"><div className="panel logs">
          <h3>최근 변경</h3>
          {recentLogs.length === 0 ? <p className="muted">아직 기록이 없어요.</p> :
            recentLogs.map((l) => (
              <div key={l.id} className="logrow">
                <span className="lwho">{l.who || "—"}</span>
                <span className="lact">{l.action}</span>
                <span className="ltar">{l.target}</span>
                <span className="ltime mono">{(l.created_at || "").slice(5, 16).replace("T", " ")}</span>
              </div>
            ))}
        </div></div>
      )}

      <nav className="tabs"><div className="wrap tabs-in">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          const n = cages.filter((c) => c.grp === g.key).length;
          return (
            <button key={g.key} className={"tab" + (grp === g.key ? " on" : "")} onClick={() => setGrp(g.key)}>
              <Icon size={15} /> {g.label} <span className="tcount">{n}</span>
            </button>
          );
        })}
      </div></nav>

      <main className="wrap">
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input className="in" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Mouse · 유전자형 · DOB 검색 (예: HM, IHC-x)" />
            {q && <button className="iconbtn" onClick={() => setQ("")}><X size={14} /></button>}
          </div>
          <button className="tool-icon" data-tip="Treatment Schedule"
            aria-label="Treatment Schedule" onClick={() => setSchedOpen(true)}>
            <CalendarDays size={17} />
          </button>
          <span className="stat">
            케이지 {gCages.length} · Mouse {totalMice}
            {EXP_TAGS.map((t) => {
              const n = gCages.filter((c) => asTags(c.tags).includes(t.key)).length;
              return n ? ` · ${t.label} ${n}` : "";
            }).join("")}
            {doneCages.length > 0 && ` · 완료 ${doneCages.length}`}
          </span>
          {canEdit && <button className="btn btn-p" onClick={addCage}><Plus size={15} /> 케이지 추가</button>}
        </div>


        {cageOps.loading ? <p className="muted">불러오는 중…</p> :
          gCages.length === 0 ? <p className="muted">케이지가 없어요.</p> :
            (q && !gCages.some((c) => (byCage[c.id] || []).some((m) =>
              [m.label, m.g1, m.g2, m.g3, m.dob, m.note].join(" ").toLowerCase().includes(q.toLowerCase())))) ? (
              <div className="empty">
                <p className="empty-t">‘{q}’ 검색 결과가 없어요</p>
                <p className="muted">ex. HM, DOB 등을 검색하세요</p>
                <button className="btn btn-s" style={{ marginTop: 12 }} onClick={() => setQ("")}>검색 지우기</button>
              </div>
            ) :
            gCages.map((c, i) => (
              <CageCard key={c.id} cage={c} mice={byCage[c.id] || []} ops={ops} cageOps={cageOps} me={me} q={q} doxRows={doxRows} doxOps={doxOps} scheds={scheds}
                dragCage={{
                  isDragging: cDrag === i,
                  isOver: cOver === i && cDrag !== i,
                  side: cSide,
                  onDragStart: () => setCDrag(i),
                  onDragEnd: () => { setCDrag(null); setCOver(null); },
                  onDragOver: (e) => {
                    if (q || cDrag === null) return;
                    e.preventDefault();
                    const r = e.currentTarget.getBoundingClientRect();
                    setCSide(e.clientY < r.top + r.height / 2 ? "above" : "below");
                    setCOver(i);
                  },
                  onDragLeave: () => setCOver((v) => (v === i ? null : v)),
                  onDrop: async (e) => {
                    e.preventDefault();
                    if (q || cDrag === null || cDrag === i) { setCDrag(null); setCOver(null); return; }
                    const from = cDrag;
                    let to = cSide === "below" ? i + 1 : i;
                    if (from < to) to -= 1;
                    setCDrag(null); setCOver(null);
                    if (from === to) return;
                    await persistOrder(gCages, from, to, "mc_cages");
                    await cageOps.reload();
                  },
                }} />
            ))}
        {doneCages.length > 0 && !q && (
          <div className="done-section">
            <button className="collapse-bar" onClick={() => setShowDone((v) => !v)}>
              {showDone ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 완료된 실험 {doneCages.length}건 {showDone ? "숨기기" : "보기"}
            </button>
            {showDone && doneCages.map((c) => (
              <CageCard key={c.id} cage={c} mice={byCage[c.id] || []} ops={ops} cageOps={cageOps} me={me} q={q} doxRows={doxRows} doxOps={doxOps} scheds={scheds} />
            ))}
          </div>
        )}
      </main>

      <footer className="foot"><div className="wrap">
       마우스 관리 현황 웹사이트 베타버전
      </div></footer>
      {schedOpen && (
        <SchedLibrary me={me} scheds={scheds} schedOps={schedOps} cycles={doxRows}
          cycleOps={doxOps} cages={gCages} cageOps={cageOps} onClose={() => setSchedOpen(false)} />
      )}
      {intro && <IntroModal onClose={() => setIntro(false)} />}
      {chatOpen
        ? <ChatPanel onClose={() => setChatOpen(false)} askName={askText} />
        : <button className="chat-fab" title="참여자 대화" onClick={() => setChatOpen(true)}>
            <MessageCircle size={22} />
          </button>}
    </div>
    </EditCtx.Provider>
    </AgeUnitCtx.Provider>
  );
}

export default function App() {
  return <ConfirmProvider><AppInner /></ConfirmProvider>;
}
