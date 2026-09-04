import { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Search,
  History, GripVertical, Rat,
} from "lucide-react";
import { hasConfig, supabase } from "./supabaseClient";
import { useTable } from "./db";
import { ConfirmProvider, useConfirm, usePrompt, useSwipeDelete } from "./ui.jsx";

/* ---------------- constants ---------------- */
const GROUPS = [
  { key: "chd8", label: "CHD8", icon: Rat },
  { key: "gfap", label: "GFAP x rtTA x 4F2A", icon: Rat },
  { key: "behavior", label: "행동실험 · IHC", icon: Rat },
];
const CAGE_TYPES = {
  mating: { label: "Mating", color: "#0071E3" },
  dox: { label: "DOX", color: "#C2610B" },
  behavior: { label: "Behavior", color: "#7A3FBF" },
  ihc: { label: "IHC", color: "#0F7C8A" },
  other: { label: "기타", color: "#86868B" },
};
const DOX_STATUS = { 완료: "#1D8C4B", 진행중: "#C2610B", 예정: "#98989D" };

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
const ageBadge = (w) => (w == null ? null : w < 4 ? "baby" : `${w}w`);

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
      <td colSpan={8}>
        <div className="mform">
          <Field label="개체"><input className="in" value={f.label} onChange={set("label")} placeholder="M1 / F5 / baby" autoFocus /></Field>
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

function MouseRow({ m, idx, cage, ops, me, canDrag, isBaby, w, dragI, setDragI,
  overI, setOverI, overSide, setOverSide, mice, setEditing }) {
  const confirm = useConfirm();
  const doDelete = async () => {
    const ok = await confirm({
      title: "개체를 삭제할까요?",
      body: `${cage.label} · ${m.label || "이름 없음"}`,
    });
    if (ok) await ops.remove(m.id, me, `${cage.label} / ${m.label}`);
    return ok;
  };
  const { dx, dy, armed, bind } = useSwipeDelete({ onDelete: doDelete, disabled: !canDrag });

  return (
    <tr
      className={(isBaby ? "baby" : "") + (dragI === idx ? " dragging" : "") +
        (overI === idx && dragI !== idx ? (overSide === "above" ? " drop-above" : " drop-below") : "") +
        (dx !== 0 || dy !== 0 ? " swiping" : "") + (armed ? " armed" : "")}
      style={(dx || dy) ? { transform: `translate(${dx}px, ${dy}px) scale(${armed ? 0.97 : 1})` } : undefined}
      {...bind}
      onDragOver={(e) => {
        if (!canDrag || dragI === null) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        setOverSide(e.clientY < r.top + r.height / 2 ? "above" : "below");
        setOverI(idx);
      }}
      onDragLeave={() => setOverI((v) => (v === idx ? null : v))}
      onDrop={async (e) => {
        e.preventDefault();
        if (!canDrag || dragI === null || dragI === idx) { setDragI(null); setOverI(null); return; }
        const from = dragI;
        let to = overSide === "below" ? idx + 1 : idx;
        if (from < to) to -= 1;
        setDragI(null); setOverI(null);
        if (from === to) return;
        await persistOrder(mice, from, to, "mc_mice");
        await ops.reload();
      }}>
      <td className="hcell">
        {canDrag && (
          <span className="handle" title="드래그해서 순서 변경" draggable
            onDragStart={() => setDragI(idx)} onDragEnd={() => { setDragI(null); setOverI(null); }}>
            <GripVertical size={14} />
          </span>
        )}
      </td>
      <td className="mono strong">{m.label}</td>
      <td className="c">{m.g1 && <span className="gchip">{m.g1}</span>}</td>
      <td className="c">{m.g2 && <span className="gchip">{m.g2}</span>}</td>
      <td className="c">{m.g3 && <span className="gchip">{m.g3}</span>}</td>
      <td className="mono">{m.dob}{ageBadge(w) && <span className="age">{ageBadge(w)}</span>}</td>
      <td className="note">{m.note}{m.weight ? <span className="wt">{m.weight}</span> : null}</td>
      <td className="row-actions">
        <button className="iconbtn" title="수정" onClick={() => setEditing(m.id)}><Pencil size={13} /></button>
        <button className="iconbtn danger" title="삭제" onClick={doDelete}><Trash2 size={13} /></button>
      </td>
    </tr>
  );
}

function CageCard({ cage, mice, ops, cageOps, me, q, dragCage }) {
  const confirm = useConfirm();
  const deleteCage = async () => {
    const ok = await confirm({
      title: "케이지를 삭제할까요?",
      body: `${cage.label} · 소속 Mouse ${mice.length}마리가 함께 삭제됩니다.`,
    });
    if (ok) await cageOps.remove(cage.id, me, `케이지 ${cage.label}`);
    return ok;
  };
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(null); // id | 'new'
  const [editCage, setEditCage] = useState(false);
  const [dragI, setDragI] = useState(null);
  const [overI, setOverI] = useState(null);
  const [overSide, setOverSide] = useState("above");
  const [cf, setCf] = useState({ label: cage.label, note: cage.note || "", type: cage.type });
  const t = CAGE_TYPES[cage.type] || CAGE_TYPES.other;

  const list = useMemo(() => {
    if (!q) return mice;
    const s = q.toLowerCase();
    return mice.filter((m) => [m.label, m.g1, m.g2, m.g3, m.dob, m.note].join(" ").toLowerCase().includes(s));
  }, [mice, q]);
  if (q && list.length === 0) return null;

  const counts = useMemo(() => {
    let male = 0, female = 0, baby = 0;
    mice.forEach((m) => {
      const L = (m.label || "").toUpperCase();
      if (L.startsWith("BABY")) baby++;
      else if (L.startsWith("M")) male++;
      else if (L.startsWith("F")) female++;
    });
    return { male, female, baby, total: mice.length };
  }, [mice]);

  return (
    <div className={"cage" + (dragCage?.isDragging ? " dragging" : "") +
      (dragCage?.isOver ? (dragCage.side === "above" ? " drop-above" : " drop-below") : "")}
      onDragOver={dragCage?.onDragOver} onDrop={dragCage?.onDrop} onDragLeave={dragCage?.onDragLeave}>
      <div className="cage-head">
        <span className="handle" title="드래그해서 케이지 순서 변경"
          draggable onDragStart={dragCage?.onDragStart} onDragEnd={dragCage?.onDragEnd}><GripVertical size={15} /></span>
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
              ♂{counts.male} · ♀{counts.female}{counts.baby ? ` · baby ${counts.baby}` : ""} · 총 {counts.total}
            </span>
            <span className="cage-actions">
              <button className="iconbtn" title="케이지 수정" onClick={() => setEditCage(true)}><Pencil size={14} /></button>
              <button className="iconbtn danger" title="케이지 삭제"
                onClick={deleteCage}><Trash2 size={14} /></button>
              <button className="iconbtn" onClick={() => setOpen((v) => !v)}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            </span>
          </>
        )}
      </div>

      {open && (
        <table className="mtable">
          <thead>
            <tr>
              <th style={{ width: "34px" }}></th>
              <th style={{ width: "12%" }}>개체</th>
              <th className="c" style={{ width: "11%" }}>{cage.g1_label || "G1"}</th>
              <th className="c" style={{ width: "11%" }}>{cage.g2_label || "G2"}</th>
              <th className="c" style={{ width: "11%" }}>{cage.g3_label || "G3"}</th>
              <th style={{ width: "17%" }}>DOB</th>
              <th>비고</th>
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
                  isBaby={isBaby} w={w}
                  dragI={dragI} setDragI={setDragI} overI={overI} setOverI={setOverI}
                  overSide={overSide} setOverSide={setOverSide} mice={mice} setEditing={setEditing} />
              );
            })}
            {editing === "new" && (
              <MouseForm cage={cage} onCancel={() => setEditing(null)}
                onSave={async (f) => { await ops.add({ ...f, cage_id: cage.id, sort: mice.length + 1 }, me, `${cage.label} / ${f.label}`); setEditing(null); }} />
            )}
          </tbody>
        </table>
      )}

      {open && editing !== "new" && (
        <button className="add-row" onClick={() => setEditing("new")}><Plus size={14} /> 개체 추가</button>
      )}
    </div>
  );
}

/* ---------------- DOX schedule ---------------- */
function DoxPanel({ me }) {
  const [rows, ops] = useTable("mc_dox", ["sort"]);
  const [open, setOpen] = useState(false);
  const cur = rows.find((r) => r.status === "진행중");
  const done = rows.filter((r) => r.status === "완료").length;
  const cycle = (r) => ops.update(r.id, { status: r.status === "예정" ? "진행중" : r.status === "진행중" ? "완료" : "예정" }, me, `DOX ${r.dates}`);
  return (
    <div className="panel dox">
      <div className="panel-head">
        <h3>DOX 투여 스케줄</h3>
        <span className="dox-sum">완료 {done} / 총 {rows.length}{cur ? ` · 진행 중 ${cur.dates}` : ""}</span>
        <button className="btn btn-s" onClick={() => setOpen((v) => !v)}>{open ? "접기" : "전체 보기"}</button>
      </div>
      <div className="dox-list">
        {(open ? rows : rows.filter((r) => r.status !== "완료").slice(0, 6)).map((r) => (
          <button key={r.id} className="dox-row" onClick={() => cycle(r)} title="클릭하면 예정 → 진행중 → 완료">
            <span className="dstat" style={{ background: DOX_STATUS[r.status] || "#8A97A5" }}>{r.status}</span>
            <span className="mono">{r.dates}</span>
            <span className="ddose">{r.dose}</span>
            <span className="dcycle">{r.cycle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- name gate ---------------- */
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
  const [cages, cageOps] = useTable("mc_cages", ["grp", "sort"]);
  const [mice, ops] = useTable("mc_mice", ["cage_id", "sort"]);
  const [logs] = useTable("mc_log", []);


  if (!hasConfig) {
    return <div className="cfg"><h1>환경 변수가 필요해요</h1>
      <pre>{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}</pre></div>;
  }

  const gCages = cages.filter((c) => c.grp === grp);
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
    <div className="app">
      <header className="top">
        <div className="wrap top-in">
          <div>
            <h1>Mouse Management</h1>
            <p className="sub">Cage · Mouse list (LIVE UPDATE)</p>
          </div>
          <div className="who">
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
              placeholder="개체 · 유전자형 · DOB 검색 (예: HM, IHC-x)" />
            {q && <button className="iconbtn" onClick={() => setQ("")}><X size={14} /></button>}
          </div>
          <span className="stat">케이지 {gCages.length} · 개체 {totalMice}</span>
          <button className="btn btn-p" onClick={addCage}><Plus size={15} /> 케이지 추가</button>
        </div>

        {grp === "gfap" && <DoxPanel me={me} />}

        {cageOps.loading ? <p className="muted">불러오는 중…</p> :
          gCages.length === 0 ? <p className="muted">케이지가 없어요.</p> :
            (q && !gCages.some((c) => (byCage[c.id] || []).some((m) =>
              [m.label, m.g1, m.g2, m.g3, m.dob, m.note].join(" ").toLowerCase().includes(q.toLowerCase())))) ? (
              <div className="empty">
                <p className="empty-t">‘{q}’ 검색 결과가 없어요</p>
                <p className="muted">개체명 · 유전자형 · DOB · 비고에서 찾습니다.</p>
                <button className="btn btn-s" style={{ marginTop: 12 }} onClick={() => setQ("")}>검색 지우기</button>
              </div>
            ) :
            gCages.map((c, i) => (
              <CageCard key={c.id} cage={c} mice={byCage[c.id] || []} ops={ops} cageOps={cageOps} me={me} q={q}
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
      </main>

      <footer className="foot"><div className="wrap">
       마우스 현황 실시간 업데이트는 이곳에서 관리합니다.
      </div></footer>
    </div>
  );
}

export default function App() {
  return <ConfirmProvider><AppInner /></ConfirmProvider>;
}
