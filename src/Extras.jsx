import { useEffect, useRef, useState } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import { supabase } from "./supabaseClient";

const NAME_KEY = "mc_chat_name";
export const readChatName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } };
const saveChatName = (n) => { try { localStorage.setItem(NAME_KEY, n); } catch { /* noop */ } };

/* ---------------- 실시간 접속자 ---------------- */
export function usePresence(myName, canEdit) {
  const [people, setPeople] = useState([]);
  useEffect(() => {
    if (!supabase) return;
    const id = Math.random().toString(36).slice(2, 9);
    const ch = supabase.channel("mc-presence", { config: { presence: { key: id } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const list = Object.values(state).flat().map((p) => ({
        name: p.name || "익명", editor: !!p.editor, at: p.at,
      }));
      setPeople(list);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ name: myName || "익명", editor: canEdit, at: new Date().toISOString() });
      }
    });
    return () => { supabase.removeChannel(ch); };
  }, [myName, canEdit]);
  return people;
}

/* ---------------- 채팅 ---------------- */
export function ChatPanel({ onClose, askName }) {
  const [rows, setRows] = useState([]);
  const [text, setText] = useState("");
  const [name, setName] = useState(readChatName);
  const boxRef = useRef(null);

  const load = async () => {
    const { data } = await supabase.from("mc_chat").select("*").order("created_at").limit(200);
    if (data) setRows(data);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("rt-mc_chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "mc_chat" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [rows]);

  const send = async () => {
    const t = text.trim(); if (!t) return;
    let who = name;
    if (!who) {
      who = await askName({ title: "이름을 입력하세요", body: "채팅에 표시될 이름이에요.", placeholder: "예: 대열", okText: "확인" });
      if (!who) return;
      setName(who); saveChatName(who);
    }
    setText("");
    const { error } = await supabase.from("mc_chat").insert({ name: who, text: t });
    if (error) alert("전송 실패: " + error.message);
    await load();
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <aside className="chat">
      <div className="chat-head">
        <MessageCircle size={16} />
        <b>참여자 대화</b>
        {name && <span className="chat-me">{name}</span>}
        <button className="iconbtn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="chat-body" ref={boxRef}>
        {rows.length === 0 ? <p className="muted" style={{ padding: 12 }}>아직 메시지가 없어요.</p> :
          rows.map((r) => (
            <div key={r.id} className={"msg" + (r.name === name ? " mine" : "")}>
              <div className="msg-meta"><b>{r.name || "익명"}</b><span>{fmt(r.created_at)}</span></div>
              <div className="msg-text">{r.text}</div>
            </div>
          ))}
      </div>
      <div className="chat-input">
        <input className="in" value={text} placeholder="메시지 입력"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()} />
        <button className="btn btn-p" onClick={send} disabled={!text.trim()}><Send size={15} /></button>
      </div>
    </aside>
  );
}

/* ---------------- 첫 방문 안내 ---------------- */
const INTRO_KEY = "mc_intro_hidden_until";
export function IntroModal({ onClose }) {
  const [hide, setHide] = useState(false);
  const close = () => {
    if (hide) {
      const today = new Date().toISOString().slice(0, 10);
      try { localStorage.setItem(INTRO_KEY, today); } catch { /* noop */ }
    }
    onClose();
  };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal intro" role="dialog" aria-modal="true">
        <h3 className="modal-title">Mouse Management Website (Beta)</h3>
        <p className="modal-body">케이지와 마우스 현황을 실시간으로 함께 보는 페이지예요.</p>
        <ul className="intro-list">
          <li><b>탭</b> CHD8 · GFAP · 행동실험 · IHC Cage</li>
          <li><b>검색</b> 개체명 · 유전자형 · DOB 등</li>
          <li><b>주령 배지</b> 눌러서 주 · 개월 · 년 단위로 자동 전환이 가능해요</li>
          <li><b>유전자형</b> 각 마우스 칸에 커서를 올리면 팁이 표시돼요</li>
          <li><b>대화</b> 오른쪽 아래 버튼으로 프로젝트 참여자끼리 소통이 가능해요</li>
          <li><b>편집</b> 관리자만 가능하고, 변경 기록이 남아요</li>
        </ul>
        <label className="intro-check">
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} />
          오늘 하루 보지 않기
        </label>
        <div className="modal-actions">
          <button className="btn btn-p" style={{ flex: 1 }} onClick={close}>확인</button>
        </div>
      </div>
    </div>
  );
}
export function shouldShowIntro() {
  try {
    const until = localStorage.getItem(INTRO_KEY);
    return until !== new Date().toISOString().slice(0, 10);
  } catch { return true; }
}
