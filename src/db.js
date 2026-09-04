import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

// 링크만 알면 열람·편집. 변경 시 누가 했는지 기록.
export function useTable(table, orderCols) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from(table).select("*");
    (orderCols || []).forEach((c) => { q = q.order(c); });
    const { data, error } = await q;
    if (error) console.error(`[${table}] load`, error);
    if (data) setRows(data);
    setLoading(false);
  }, [table, JSON.stringify(orderCols)]);

  useEffect(() => {
    load();
    const ch = supabase.channel("rt-" + table)
      .on("postgres_changes", { event: "*", schema: "public", table }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, table]);

  const logIt = async (who, action, target) => {
    if (!who) return;
    await supabase.from("mc_log").insert({ who, action, target });
  };

  const add = async (row, who, target) => {
    const { error } = await supabase.from(table).insert({ ...row, updated_by: who || "" });
    if (error) { console.error(error); alert("저장 실패: " + error.message); return; }
    await logIt(who, "추가", target || "");
    await load();
  };
  const update = async (id, patch, who, target) => {
    const { error } = await supabase.from(table)
      .update({ ...patch, updated_by: who || "", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { console.error(error); alert("수정 실패: " + error.message); return; }
    await logIt(who, "수정", target || "");
    await load();
  };
  const remove = async (id, who, target) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { console.error(error); alert("삭제 실패: " + error.message); return; }
    await logIt(who, "삭제", target || "");
    await load();
  };
  return [rows, { add, update, remove, reload: load, loading }];
}
