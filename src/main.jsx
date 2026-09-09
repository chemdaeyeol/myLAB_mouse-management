import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 오류가 나도 흰 화면 대신 원인을 보여준다
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("App crash:", err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", padding: 28, background: "#fff",
        border: "1px solid #EBEBED", borderRadius: 16, fontFamily: "system-ui,sans-serif" }}>
        <h1 style={{ fontSize: 19, margin: "0 0 10px" }}>화면을 불러오지 못했어요</h1>
        <p style={{ color: "#6E6E73", fontSize: 14, margin: "0 0 14px" }}>
          아래 내용을 알려주시면 원인을 바로 찾을 수 있어요.
        </p>
        <pre style={{ background: "#F5F5F7", padding: 14, borderRadius: 10, fontSize: 12,
          whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
          {String(this.state.err?.message || this.state.err)}
        </pre>
        <button onClick={() => location.reload()} style={{ marginTop: 16, padding: "9px 16px",
          borderRadius: 980, border: "none", background: "#0071E3", color: "#fff",
          fontSize: 14, cursor: "pointer" }}>새로고침</button>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
);
