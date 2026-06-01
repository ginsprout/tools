import { useState, useCallback } from "react";

const DEFAULT_PROJECTS = [
  { id: "design", name: "一般デザイン", color: "#7C9EBF", icon: "✏️" },
  { id: "novel", name: "小説（遊夢）", color: "#B08A8A", icon: "📖" },
  { id: "support", name: "発達×デザイン", color: "#8AAF8A", icon: "🌱" },
  { id: "ginsprout", name: "その他事業", color: "#A08ABF", icon: "✦" },
];

const TABS = ["Dashboard", "Plan", "Do", "Check"];

const today = () => new Date().toISOString().slice(0, 10);
const thisWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.getMonth()+1}/${d.getDate()}〜${end.getMonth()+1}/${end.getDate()}`;
}

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [tasks, setTasks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", projectId: "design", week: thisWeek(), month: new Date().toISOString().slice(0,7), priority: "medium", memo: "" });
  const [newReview, setNewReview] = useState({ week: thisWeek(), memo: "", projectId: "all" });
  const [aiComment, setAiComment] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", color: "#999999", icon: "⭐" });
  const [filterProject, setFilterProject] = useState("all");
  const [filterWeek, setFilterWeek] = useState(thisWeek());
  const [doFilter, setDoFilter] = useState("all");

  const getProject = (id) => projects.find(p => p.id === id) || { name: "不明", color: "#999", icon: "?" };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks(prev => [...prev, { ...newTask, id: Date.now().toString(), done: false, progress: 0, doneAt: null, addedAt: today() }]);
    setNewTask(t => ({ ...t, title: "", memo: "" }));
  };

  const toggleDone = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? today() : null } : t));
  };

  const setProgress = (id, val) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: val } : t));
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const addReview = () => {
    if (!newReview.memo.trim()) return;
    setReviews(prev => [...prev, { ...newReview, id: Date.now().toString(), createdAt: today() }]);
    setNewReview(r => ({ ...r, memo: "" }));
  };

  const weekTasks = (week) => tasks.filter(t => t.week === week);
  const weekDone = (week) => weekTasks(week).filter(t => t.done).length;
  const weekRate = (week) => {
    const total = weekTasks(week).length;
    return total === 0 ? 0 : Math.round((weekDone(week) / total) * 100);
  };

  const projectRate = (pid) => {
    const pt = tasks.filter(t => t.projectId === pid);
    if (pt.length === 0) return 0;
    return Math.round((pt.filter(t => t.done).length / pt.length) * 100);
  };

  const generateAiComment = async () => {
    setAiLoading(true);
    setAiComment("");
    const weekStr = filterWeek;
    const wt = tasks.filter(t => t.week === weekStr);
    const done = wt.filter(t => t.done);
    const undone = wt.filter(t => !t.done);
    const rate = weekRate(weekStr);
    const prompt = `あなたはフリーランスのパーソナルコーチです。以下のデータをもとに、日本語で温かく具体的な振り返りコメントと改善アドバイスを200字程度で書いてください。

週: ${getWeekLabel(weekStr)}
完了タスク(${done.length}件): ${done.map(t=>t.title).join("、") || "なし"}
未完了タスク(${undone.length}件): ${undone.map(t=>t.title).join("、") || "なし"}
達成率: ${rate}%

ポジティブな点と、次の週に向けた具体的なアドバイスを含めてください。`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(c => c.type === "text")?.text || "コメントを取得できませんでした。";
      setAiComment(text);
    } catch {
      setAiComment("AIコメントの取得に失敗しました。");
    }
    setAiLoading(false);
  };

  const addProject = () => {
    if (!newProject.name.trim()) return;
    const id = "proj_" + Date.now();
    setProjects(prev => [...prev, { ...newProject, id }]);
    setNewProject({ name: "", color: "#999999", icon: "⭐" });
    setShowAddProject(false);
  };

  const allWeeks = [...new Set(tasks.map(t => t.week))].sort().reverse();
  const doTasks = tasks.filter(t => {
    if (doFilter === "all") return true;
    if (doFilter === "today") return !t.done;
    if (doFilter === "done") return t.done;
    return t.projectId === doFilter;
  });

  const priorityColor = (p) => ({ high: "#C97C7C", medium: "#B0956A", low: "#7A9E7A" }[p] || "#999");
  const priorityLabel = (p) => ({ high: "高", medium: "中", low: "低" }[p] || p);

  return (
    <div style={{ fontFamily: "'Noto Serif JP', 'Georgia', serif", background: "#0F0E0C", minHeight: "100vh", color: "#E8E3D9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600&family=Cinzel:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1a1916; } ::-webkit-scrollbar-thumb { background: #4a4640; border-radius: 2px; }
        input, textarea, select { font-family: inherit; background: #1C1A16; border: 1px solid #3a3630; color: #E8E3D9; border-radius: 6px; padding: 8px 12px; font-size: 13px; outline: none; width: 100%; }
        input:focus, textarea:focus, select:focus { border-color: #8A7A6A; }
        textarea { resize: vertical; min-height: 60px; }
        button { cursor: pointer; font-family: inherit; border: none; border-radius: 6px; transition: all 0.2s; }
        .tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .card { background: #1C1A16; border: 1px solid #2E2C28; border-radius: 10px; padding: 16px; margin-bottom: 10px; }
        .progress-bar { height: 4px; background: #2E2C28; border-radius: 2px; overflow: hidden; margin-top: 6px; }
        .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
        .big-number { font-family: 'Cinzel', serif; font-size: 36px; font-weight: 600; line-height: 1; }
        .section-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7A7268; margin-bottom: 12px; font-family: 'Cinzel', serif; }
        .circle-chart { position: relative; display: inline-flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #2E2C28" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: "#C8B99A", letterSpacing: 3 }}>GINSPROUT</span>
          <span style={{ fontSize: 11, color: "#5A5650", letterSpacing: 2 }}>PDCA MANAGER</span>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", background: "none", color: tab === t ? "#E8E3D9" : "#5A5650",
              borderBottom: tab === t ? "2px solid #C8B99A" : "2px solid transparent",
              borderRadius: 0, fontSize: 13, letterSpacing: 1,
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 800, margin: "0 auto" }}>

        {/* ===== DASHBOARD ===== */}
        {tab === "Dashboard" && (
          <div>
            <p className="section-title">Overview</p>
            {/* Project cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {projects.map(p => {
                const rate = projectRate(p.id);
                const pt = tasks.filter(t => t.projectId === p.id);
                const doneCnt = pt.filter(t => t.done).length;
                return (
                  <div key={p.id} className="card" style={{ borderLeft: `3px solid ${p.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#C8B99A" }}>{p.icon} {p.name}</span>
                      <span className="big-number" style={{ fontSize: 22, color: p.color }}>{rate}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#5A5650", marginBottom: 6 }}>{doneCnt}/{pt.length} タスク完了</div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${rate}%`, background: p.color }} /></div>
                  </div>
                );
              })}
            </div>

            {/* Weekly snapshot */}
            <p className="section-title">今週のスナップショット</p>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#7A7268", marginBottom: 4 }}>{getWeekLabel(thisWeek())}</div>
                  <span className="big-number" style={{ color: "#C8B99A" }}>{weekRate(thisWeek())}%</span>
                  <span style={{ fontSize: 12, color: "#7A7268", marginLeft: 8 }}>達成率</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, color: "#E8E3D9", fontFamily: "'Cinzel', serif" }}>{weekDone(thisWeek())}<span style={{ fontSize: 12, color: "#7A7268" }}>/{weekTasks(thisWeek()).length}</span></div>
                  <div style={{ fontSize: 11, color: "#7A7268" }}>タスク完了</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginTop: 12, height: 6 }}>
                <div className="progress-fill" style={{ width: `${weekRate(thisWeek())}%`, background: "linear-gradient(90deg, #8A7A6A, #C8B99A)" }} />
              </div>
            </div>

            {/* Undone tasks */}
            <p className="section-title" style={{ marginTop: 16 }}>未完了タスク（今週）</p>
            {weekTasks(thisWeek()).filter(t => !t.done).length === 0
              ? <div style={{ fontSize: 13, color: "#5A5650", padding: "12px 0" }}>今週の未完了タスクはありません ✦</div>
              : weekTasks(thisWeek()).filter(t => !t.done).map(t => {
                const p = getProject(t.projectId);
                return (
                  <div key={t.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: p.color, fontSize: 16 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: "#5A5650" }}>{p.name}</div>
                    </div>
                    <span className="tag" style={{ background: priorityColor(t.priority) + "22", color: priorityColor(t.priority) }}>{priorityLabel(t.priority)}</span>
                  </div>
                );
              })}
          </div>
        )}

        {/* ===== PLAN ===== */}
        {tab === "Plan" && (
          <div>
            <p className="section-title">タスク登録</p>
            <div className="card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <input placeholder="タスク名" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} onKeyDown={e => e.key === "Enter" && addTask()} />
                <select value={newTask.projectId} onChange={e => setNewTask(t => ({ ...t, projectId: e.target.value }))}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
                <div>
                  <label style={{ fontSize: 11, color: "#7A7268", display: "block", marginBottom: 4 }}>対象週（月曜日）</label>
                  <input type="date" value={newTask.week} onChange={e => setNewTask(t => ({ ...t, week: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#7A7268", display: "block", marginBottom: 4 }}>優先度</label>
                  <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <textarea placeholder="メモ（任意）" value={newTask.memo} onChange={e => setNewTask(t => ({ ...t, memo: e.target.value }))} style={{ marginBottom: 8 }} />
              <button onClick={addTask} style={{ background: "#3a3530", color: "#C8B99A", padding: "8px 20px", fontSize: 13 }}>＋ 追加</button>
            </div>

            {/* Filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ width: "auto" }}>
                <option value="all">全プロジェクト</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} style={{ width: "auto" }}>
                {[thisWeek(), ...allWeeks.filter(w => w !== thisWeek())].map(w => (
                  <option key={w} value={w}>{getWeekLabel(w)}</option>
                ))}
              </select>
            </div>

            <p className="section-title">タスク一覧</p>
            {tasks.filter(t => (filterProject === "all" || t.projectId === filterProject) && t.week === filterWeek).length === 0
              ? <div style={{ fontSize: 13, color: "#5A5650", padding: "12px 0" }}>この週のタスクはまだありません</div>
              : tasks.filter(t => (filterProject === "all" || t.projectId === filterProject) && t.week === filterWeek).map(t => {
                const p = getProject(t.projectId);
                return (
                  <div key={t.id} className="card" style={{ borderLeft: `3px solid ${p.color}`, opacity: t.done ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, textDecoration: t.done ? "line-through" : "none", marginBottom: 4 }}>{t.title}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span className="tag" style={{ background: p.color + "22", color: p.color }}>{p.icon} {p.name}</span>
                          <span className="tag" style={{ background: priorityColor(t.priority) + "22", color: priorityColor(t.priority) }}>優先:{priorityLabel(t.priority)}</span>
                          {t.done && <span className="tag" style={{ background: "#4A6A4A22", color: "#8AAF8A" }}>✓完了</span>}
                        </div>
                        {t.memo && <div style={{ fontSize: 11, color: "#7A7268", marginTop: 6 }}>{t.memo}</div>}
                      </div>
                      <button onClick={() => deleteTask(t.id)} style={{ background: "none", color: "#5A5650", fontSize: 16, padding: "0 4px" }}>×</button>
                    </div>
                  </div>
                );
              })}

            {/* Project management */}
            <div style={{ marginTop: 24 }}>
              <p className="section-title">プロジェクト管理</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {projects.map(p => (
                  <span key={p.id} className="tag" style={{ background: p.color + "22", color: p.color, fontSize: 12, padding: "4px 10px" }}>{p.icon} {p.name}</span>
                ))}
                <button onClick={() => setShowAddProject(!showAddProject)} style={{ background: "#2A2826", color: "#7A7268", padding: "4px 10px", fontSize: 12 }}>＋ 追加</button>
              </div>
              {showAddProject && (
                <div className="card">
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input placeholder="プロジェクト名" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} />
                    <input placeholder="アイコン" value={newProject.icon} onChange={e => setNewProject(p => ({ ...p, icon: e.target.value }))} />
                    <input type="color" value={newProject.color} onChange={e => setNewProject(p => ({ ...p, color: e.target.value }))} style={{ padding: 4 }} />
                  </div>
                  <button onClick={addProject} style={{ background: "#3a3530", color: "#C8B99A", padding: "6px 16px", fontSize: 12 }}>追加</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== DO ===== */}
        {tab === "Do" && (
          <div>
            <p className="section-title">進捗管理</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[["all","すべて"],["today","未完了"],["done","完了済み"]].map(([v,l]) => (
                <button key={v} onClick={() => setDoFilter(v)} style={{ background: doFilter === v ? "#3a3530" : "#1C1A16", color: doFilter === v ? "#C8B99A" : "#7A7268", border: "1px solid #2E2C28", padding: "6px 14px", fontSize: 12 }}>{l}</button>
              ))}
              {projects.map(p => (
                <button key={p.id} onClick={() => setDoFilter(p.id)} style={{ background: doFilter === p.id ? p.color + "33" : "#1C1A16", color: doFilter === p.id ? p.color : "#7A7268", border: `1px solid ${doFilter === p.id ? p.color : "#2E2C28"}`, padding: "6px 14px", fontSize: 12 }}>{p.icon}</button>
              ))}
            </div>

            {doTasks.length === 0
              ? <div style={{ fontSize: 13, color: "#5A5650", padding: "12px 0" }}>タスクがありません</div>
              : doTasks.map(t => {
                const p = getProject(t.projectId);
                return (
                  <div key={t.id} className="card" style={{ borderLeft: `3px solid ${p.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => toggleDone(t.id)} style={{
                        width: 20, height: 20, borderRadius: "50%", background: t.done ? p.color : "none",
                        border: `2px solid ${p.color}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11
                      }}>{t.done ? "✓" : ""}</button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#5A5650" : "#E8E3D9", marginBottom: 4 }}>{t.title}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span className="tag" style={{ background: p.color + "22", color: p.color }}>{p.icon} {p.name}</span>
                          <span style={{ fontSize: 11, color: "#5A5650" }}>{getWeekLabel(t.week)}</span>
                        </div>
                        {!t.done && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7A7268", marginBottom: 4 }}>
                              <span>進捗</span><span>{t.progress}%</span>
                            </div>
                            <input type="range" min="0" max="100" step="10" value={t.progress}
                              onChange={e => setProgress(t.id, Number(e.target.value))}
                              style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }} />
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${t.progress}%`, background: p.color }} /></div>
                          </div>
                        )}
                        {t.done && t.doneAt && <div style={{ fontSize: 11, color: "#5A5650", marginTop: 4 }}>完了日: {t.doneAt}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ===== CHECK ===== */}
        {tab === "Check" && (
          <div>
            <p className="section-title">週次レビュー</p>
            {/* Week selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[thisWeek(), ...allWeeks.filter(w => w !== thisWeek())].slice(0, 6).map(w => (
                <button key={w} onClick={() => setFilterWeek(w)} style={{ background: filterWeek === w ? "#3a3530" : "#1C1A16", color: filterWeek === w ? "#C8B99A" : "#7A7268", border: "1px solid #2E2C28", padding: "6px 12px", fontSize: 11 }}>{getWeekLabel(w)}</button>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "達成率", value: `${weekRate(filterWeek)}%`, color: "#C8B99A" },
                { label: "完了", value: weekDone(filterWeek), color: "#8AAF8A" },
                { label: "残り", value: weekTasks(filterWeek).length - weekDone(filterWeek), color: "#C97C7C" },
              ].map(({ label, value, color }) => (
                <div key={label} className="card" style={{ textAlign: "center" }}>
                  <div className="big-number" style={{ color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#7A7268", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Project breakdown */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#7A7268", marginBottom: 10 }}>プロジェクト別</div>
              {projects.map(p => {
                const pt = tasks.filter(t => t.projectId === p.id && t.week === filterWeek);
                if (pt.length === 0) return null;
                const rate = Math.round((pt.filter(t => t.done).length / pt.length) * 100);
                return (
                  <div key={p.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: p.color }}>{p.icon} {p.name}</span>
                      <span style={{ color: "#7A7268" }}>{pt.filter(t=>t.done).length}/{pt.length}件 ({rate}%)</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${rate}%`, background: p.color }} /></div>
                  </div>
                );
              })}
            </div>

            {/* AI Comment */}
            <p className="section-title">AI振り返りコメント</p>
            <button onClick={generateAiComment} disabled={aiLoading} style={{ background: "#2A2826", color: "#C8B99A", border: "1px solid #4a4640", padding: "10px 20px", fontSize: 13, marginBottom: 12, width: "100%" }}>
              {aiLoading ? "生成中..." : "✦ AIに振り返りを書いてもらう"}
            </button>
            {aiComment && (
              <div className="card" style={{ borderLeft: "3px solid #C8B99A", fontSize: 13, lineHeight: 1.8, color: "#D0C9BD" }}>
                {aiComment}
              </div>
            )}

            {/* Manual review */}
            <p className="section-title" style={{ marginTop: 20 }}>振り返りメモ</p>
            <div className="card">
              <textarea placeholder="今週の感想・気づき・次週への意図など" value={newReview.memo} onChange={e => setNewReview(r => ({ ...r, memo: e.target.value }))} style={{ marginBottom: 8 }} />
              <button onClick={addReview} style={{ background: "#3a3530", color: "#C8B99A", padding: "8px 20px", fontSize: 13 }}>保存</button>
            </div>

            {reviews.filter(r => r.week === filterWeek).map(r => (
              <div key={r.id} className="card" style={{ fontSize: 13, lineHeight: 1.8, color: "#C0B9AD", borderLeft: "2px solid #4a4640" }}>
                {r.memo}
                <div style={{ fontSize: 11, color: "#5A5650", marginTop: 6 }}>{r.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
