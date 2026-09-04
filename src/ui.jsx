import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

/* ---------------- 확인 팝업 (브라우저 confirm 대체) ---------------- */
const ConfirmCtx = createContext(() => Promise.resolve(false));
export const useConfirm = () => useContext(ConfirmCtx);
const PromptCtx = createContext(() => Promise.resolve(null));
export const usePrompt = () => useContext(PromptCtx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // {title, body, danger, resolve}
  const [ask, setAsk] = useState(null);     // {title, body, placeholder, value, resolve}

  const confirm = useCallback((opts) => {
    const o = typeof opts === "string" ? { title: opts } : opts || {};
    return new Promise((resolve) => setState({ danger: true, ...o, resolve }));
  }, []);
  const prompt = useCallback((opts) => {
    const o = typeof opts === "string" ? { title: opts } : opts || {};
    return new Promise((resolve) => setAsk({ value: "", ...o, resolve }));
  }, []);

  const close = (v) => { state?.resolve(v); setState(null); };
  const closeAsk = (v) => { ask?.resolve(v); setAsk(null); };

  return (
    <ConfirmCtx.Provider value={confirm}>
      <PromptCtx.Provider value={prompt}>
      {children}
      {ask && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && closeAsk(null)}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3 className="modal-title">{ask.title}</h3>
            {ask.body && <p className="modal-body">{ask.body}</p>}
            <input className="in" style={{ marginTop: 16, textAlign: "center" }} autoFocus
              placeholder={ask.placeholder || ""} value={ask.value}
              onChange={(e) => setAsk({ ...ask, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ask.value.trim()) closeAsk(ask.value.trim());
                if (e.key === "Escape") closeAsk(null);
              }} />
            <div className="modal-actions">
              <button className="btn btn-s" onClick={() => closeAsk(null)}>취소</button>
              <button className="btn btn-p" disabled={!ask.value.trim()}
                onClick={() => closeAsk(ask.value.trim())}>{ask.okText || "추가"}</button>
            </div>
          </div>
        </div>
      )}
      {state && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className={"modal-ic" + (state.danger ? " danger" : "")}>
              {state.danger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <h3 className="modal-title">{state.title}</h3>
            {state.body && <p className="modal-body">{state.body}</p>}
            <div className="modal-actions">
              <button className="btn btn-s" onClick={() => close(false)}>취소</button>
              <button className={"btn " + (state.danger ? "btn-danger" : "btn-p")} autoFocus
                onClick={() => close(true)}>{state.okText || "삭제"}</button>
            </div>
          </div>
        </div>
      )}
      </PromptCtx.Provider>
    </ConfirmCtx.Provider>
  );
}

/* ---------------- 스와이프해서 삭제 ----------------
   좌우 어느 쪽으로든 일정 거리 이상 밀면 삭제 확인이 뜹니다.
   포인터 이벤트라 마우스·트랙패드·터치 모두 동작. */
export function useSwipeDelete({ onDelete, threshold = 96, disabled }) {
  const [dx, setDx] = useState(0);
  const [outside, setOutside] = useState(false);
  const st = useRef(null);
  const cb = useRef({ onDelete, threshold });
  cb.current = { onDelete, threshold };

  // 본문 패널(.app) 바깥(좌우 여백)으로 끌었는지 판정
  const isOutsidePanel = (clientX) => {
    const panel = document.querySelector(".app");
    const vw = window.innerWidth;
    if (panel) {
      const r = panel.getBoundingClientRect();
      if (r.left > 12 || r.right < vw - 12) return clientX < r.left + 18 || clientX > r.right - 18;
    }
    return clientX < 30 || clientX > vw - 30;
  };

  const onPointerDown = (e) => {
    if (disabled || e.button === 1 || e.button === 2) return;
    if (e.target.closest("button,input,select,textarea,.handle,a")) return;

    const start = { x: e.clientX, y: e.clientY, active: false, moved: 0, out: false };
    st.current = start;

    const move = (ev) => {
      const s = st.current; if (!s) return;
      const mx = ev.clientX - s.x, my = ev.clientY - s.y;
      if (!s.active) {
        if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my)) return; // 세로 스크롤 우선
        s.active = true;
        document.body.classList.add("dragging-row");
      }
      ev.preventDefault();
      s.moved = mx;
      s.out = isOutsidePanel(ev.clientX);
      setDx(mx);
      setOutside(s.out);
    };

    const up = async () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      const s = st.current; st.current = null;
      document.body.classList.remove("dragging-row");
      setOutside(false);
      if (s?.active && (Math.abs(s.moved) >= cb.current.threshold || s.out)) {
        setDx(s.moved > 0 ? 360 : -360);
        const ok = await cb.current.onDelete();
        if (!ok) setDx(0);
      } else setDx(0);
    };

    const cancel = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      st.current = null;
      document.body.classList.remove("dragging-row");
      setDx(0); setOutside(false);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };

  const armed = Math.abs(dx) >= threshold || outside;
  return { dx, armed, outside, bind: { onPointerDown } };
}
