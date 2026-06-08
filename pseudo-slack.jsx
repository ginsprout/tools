import { useState, useEffect, useRef } from "react";

const CHANNELS = [
  { id: "zensha", name: "全社連絡", icon: "📢", desc: "全社向けアナウンス" },
  { id: "marke", name: "マーケ-広告", icon: "📣", desc: "広告・マーケティング部" },
  { id: "design", name: "デザイン部", icon: "🎨", desc: "クリエイティブチーム" },
  { id: "it-dx", name: "IT-DX推進", icon: "💻", desc: "IT・デジタル変革推進室" },
  { id: "jigyou", name: "新規事業", icon: "🚀", desc: "新規事業開発チーム" },
  { id: "zatsudan", name: "times-雑談", icon: "💬", desc: "なんでもOKの雑談部屋" },
  { id: "lunch", name: "ランチ部", icon: "🍱", desc: "ランチ情報・同行募集" },
];

const FIXED_CHARS = [
  { name: "坂本 剛志", avatar: "坂", role: "営業部長", dept: "営業", color: "#e74c3c", trait: "体育会系・根性論・飲み会大好き・昭和感強め" },
  { name: "柳沼 ひかる", avatar: "柳", role: "DX推進室長", dept: "IT", color: "#8e44ad", trait: "意識高い・カタカナ語多用・ポエム投稿しがち・LinkedIn廃人" },
  { name: "田中 もも", avatar: "も", role: "デザイナー", dept: "デザイン", color: "#e91e8c", trait: "センシティブ・クリエイティブへの拘り強い・意見求められると長文" },
  { name: "江口 悟", avatar: "江", role: "経理課長", dept: "経理", color: "#27ae60", trait: "コスト意識高い・承認に厳しい・たまに予想外の趣味を披露" },
  { name: "三好 レナ", avatar: "レ", role: "新規事業担当", dept: "新規事業", color: "#f39c12", trait: "アイデアマン・楽観的すぎる・実現性度外視・海外事例大好き" },
];

const RANDOM_CHARS = [
  { name: "青山 誠", avatar: "青", role: "マーケティング担当", dept: "マーケ", color: "#3498db" },
  { name: "林 奈緒", avatar: "林", role: "広報担当", dept: "広報", color: "#1abc9c" },
  { name: "小池 拓也", avatar: "小", role: "ITエンジニア", dept: "IT", color: "#9b59b6" },
  { name: "山本 あかり", avatar: "山", role: "営業担当", dept: "営業", color: "#e67e22" },
  { name: "中田 浩二", avatar: "中", role: "商品開発担当", dept: "開発", color: "#2c3e50" },
  { name: "西村 夏美", avatar: "西", role: "人事担当", dept: "人事", color: "#c0392b" },
  { name: "大塚 賢", avatar: "大", role: "法務担当", dept: "法務", color: "#7f8c8d" },
  { name: "吉田 優子", avatar: "吉", role: "カスタマーサクセス", dept: "CS", color: "#16a085" },
];

const CHANNEL_PROMPTS = {
  zensha: "あなたはSlackの「#全社連絡」チャンネルです。ダイセイ商事株式会社（広告・デザイン・IT・商社機能を持つ総合商社）の全社向けアナウンスや重要連絡が流れます。人事異動、社内制度変更、コンプライアンス連絡、全社ミーティングの案内など。たまに経営層の発言もある。リアルな会社のSlackっぽく、3〜6件のメッセージを生成してください。",
  marke: "あなたはSlackの「#マーケ-広告」チャンネルです。ダイセイ商事の広告・マーケティング部のやりとりです。キャンペーン施策、広告効果測定、SNS運用、競合分析、クライアント対応など。業界用語や数字が飛び交う。リアルな会社のSlackっぽく3〜6件のメッセージを生成してください。",
  design: "あなたはSlackの「#デザイン部」チャンネルです。ダイセイ商事のクリエイティブチームのやりとりです。バナー制作、ブランドガイドライン、フォント・配色議論、社内からの無茶なデザイン依頼への対応、デザイナーあるあるなど。リアルな会社のSlackっぽく3〜6件のメッセージを生成してください。",
  "it-dx": "あなたはSlackの「#IT-DX推進」チャンネルです。ダイセイ商事のIT・デジタル変革推進室のやりとりです。新ツール導入、セキュリティ対応、AI活用検討、システム障害報告、DX研修案内など。技術的な話と社内調整が混在する。リアルな会社のSlackっぽく3〜6件のメッセージを生成してください。",
  jigyou: "あなたはSlackの「#新規事業」チャンネルです。ダイセイ商事の新規事業開発チームのやりとりです。新しいビジネスアイデア、市場調査結果、スタートアップとの提携検討、ピッチ準備など。夢と現実がぶつかる場面も多い。リアルな会社のSlackっぽく3〜6件のメッセージを生成してください。",
  zatsudan: "あなたはSlackの「#times-雑談」チャンネルです。ダイセイ商事の社員が仕事に関係ない話をするチャンネルです。最近見たドラマ・映画、週末の話、愚痴、時事ネタへの感想、ゆるい日常など。くだけた口調で。リアルな会社のSlackっぽく3〜6件のメッセージを生成してください。",
  lunch: "あなたはSlackの「#ランチ部」チャンネルです。ダイセイ商事のランチ情報・同行募集チャンネルです。近くのお店の報告、ランチ行ける人募集、テイクアウト情報、社食の今日のメニューなど。リアルな会社のSlackっぽく3〜6件のメッセージを生成してください。",
};

function timeAgo(minutes) {
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  return `${Math.floor(minutes / 60)}時間前`;
}

function parseMessages(text) {
  const lines = text.split("\n").filter(l => l.trim());
  const messages = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^\*{0,2}([^:：\*]{1,20})\*{0,2}[：:](.+)/);
    if (match) {
      if (current) messages.push(current);
      const rawName = match[1].trim().replace(/\*/g, "");
      const msgText = match[2].trim();
      const fixed = FIXED_CHARS.find(c => rawName.includes(c.name) || c.name.includes(rawName));
      const random = RANDOM_CHARS.find(c => rawName.includes(c.name) || c.name.includes(rawName));
      const char = fixed || random || { name: rawName, avatar: rawName[0] || "?", role: "社員", color: "#95a5a6" };
      current = { id: Math.random(), char, text: msgText, time: Math.floor(Math.random() * 120) + 1, reactions: [], isFixed: !!fixed };
    } else if (current && line.trim() && !line.startsWith("---")) {
      current.text += "\n" + line.trim();
    }
  }
  if (current) messages.push(current);

  if (messages.length === 0) {
    messages.push({ id: Math.random(), char: RANDOM_CHARS[0], text: text, time: 5, reactions: [], isFixed: false });
  }

  let t = 5;
  return messages.reverse().map(m => {
    t += Math.floor(Math.random() * 30) + 2;
    return { ...m, time: t };
  }).reverse();
}

const REACTIONS = ["👍", "😂", "🙏", "💪", "🔥", "😅", "👀", "✅"];

export default function PseudoSlack() {
  const [activeChannel, setActiveChannel] = useState("design");
  const [channelMessages, setChannelMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async (channelId) => {
    setLoading(true);
    try {
      const allChars = [...FIXED_CHARS, ...RANDOM_CHARS];
      const charList = allChars.map(c => `${c.name}（${c.role}・${c.dept}${c.trait ? "・" + c.trait : ""}）`).join("\n");
      const prompt = `${CHANNEL_PROMPTS[channelId]}

以下の社員が登場する可能性があります（固定キャラを積極的に使ってください）：
${charList}

出力形式は必ず「名前: メッセージ」の形式で、1行1メッセージにしてください。
メッセージは日本語で、リアルなSlackっぽい口語体・絵文字も自然に使ってください。
マークダウンの見出しや説明文は不要です。名前とメッセージだけを出力してください。`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const parsed = parseMessages(text);
      setChannelMessages(prev => ({ ...prev, [channelId]: parsed }));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!channelMessages[activeChannel]) fetchMessages(activeChannel);
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages, activeChannel]);

  const ch = CHANNELS.find(c => c.id === activeChannel);
  const messages = channelMessages[activeChannel] || [];

  const addReaction = (msgId, emoji) => {
    setChannelMessages(prev => ({
      ...prev,
      [activeChannel]: prev[activeChannel].map(m =>
        m.id === msgId
          ? {
              ...m,
              reactions: m.reactions.find(r => r.emoji === emoji)
                ? m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
                : [...m.reactions, { emoji, count: 1 }]
            }
          : m
      )
    }));
  };

  const switchChannel = (id) => {
    setActiveChannel(id);
    setDrawerOpen(false);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      background: "#1a1d21",
      color: "#d1d2d3",
      fontSize: "14px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── ドロワーオーバーレイ ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "#0008", zIndex: 40,
          }}
        />
      )}

      {/* ── サイドドロワー ── */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: 260,
        background: "#19171d",
        zIndex: 50,
        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #2e2e30",
        overflowY: "auto",
      }}>
        {/* ワークスペース名 */}
        <div style={{
          padding: "20px 16px 14px",
          borderBottom: "1px solid #2e2e30",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            background: "linear-gradient(135deg, #4a154b, #7c3aed)",
            borderRadius: 8,
            width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: "bold", color: "white", flexShrink: 0,
          }}>D</div>
          <div>
            <div style={{ fontWeight: "bold", fontSize: 14, color: "#fff", lineHeight: 1.2 }}>ダイセイ商事</div>
            <div style={{ fontSize: 11, color: "#68bf6e" }}>● アクティブ</div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#9b9b9b", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
          >×</button>
        </div>

        {/* チャンネルリスト */}
        <div style={{ padding: "12px 0" }}>
          <div style={{ padding: "4px 16px 8px", fontSize: 11, color: "#9b9b9b", fontWeight: "bold", letterSpacing: 1 }}>
            チャンネル
          </div>
          {CHANNELS.map(c => (
            <div
              key={c.id}
              onClick={() => switchChannel(c.id)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                borderRadius: 6,
                margin: "1px 8px",
                background: activeChannel === c.id ? "#1264a3" : "transparent",
                color: activeChannel === c.id ? "#fff" : "#c9c9c9",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.7 }}>#</span>
              <span>{c.name}</span>
              {!channelMessages[c.id] && c.id !== activeChannel && (
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#cd2553", marginLeft: "auto" }} />
              )}
            </div>
          ))}

          {/* 固定キャラ */}
          <div style={{ padding: "16px 16px 8px", fontSize: 11, color: "#9b9b9b", fontWeight: "bold", letterSpacing: 1, marginTop: 8 }}>
            常連メンバー
          </div>
          {FIXED_CHARS.map(c => (
            <div key={c.name} style={{
              padding: "6px 16px",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 12, color: "#9b9b9b",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 4,
                background: c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "white", fontWeight: "bold", flexShrink: 0,
              }}>{c.avatar}</div>
              <div>
                <div style={{ color: "#c9c9c9", fontSize: 12 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#666" }}>{c.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ヘッダー ── */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid #2e2e30",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#1a1d21",
        flexShrink: 0,
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: "none", border: "none", color: "#9b9b9b", cursor: "pointer", fontSize: 22, padding: "0 4px", lineHeight: 1 }}
        >☰</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "bold", color: "#fff", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            # {ch?.name}
          </div>
          <div style={{ fontSize: 11, color: "#9b9b9b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch?.desc}</div>
        </div>
        <button
          onClick={() => fetchMessages(activeChannel)}
          disabled={loading}
          style={{
            padding: "7px 12px",
            background: loading ? "#2e2e30" : "#1264a3",
            color: loading ? "#9b9b9b" : "#fff",
            border: "none", borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: "bold",
            flexShrink: 0,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span style={loading ? { display: "inline-block", animation: "spin 1s linear infinite" } : {}}>↻</span>
          <span style={{ fontSize: 12 }}>{loading ? "取得中" : "更新"}</span>
        </button>
      </div>

      {/* ── メッセージエリア ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px", WebkitOverflowScrolling: "touch" }}>
        {loading && messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", color: "#9b9b9b", gap: 14,
          }}>
            <div style={{ fontSize: 36, animation: "bounce 1s infinite" }}>💬</div>
            <div style={{ fontSize: 13 }}>チャンネルを取得しています…</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ color: "#9b9b9b", textAlign: "center", marginTop: 60 }}>メッセージがありません</div>
        ) : (
          messages.map(msg => (
            <MessageItem key={msg.id} msg={msg} onReact={(emoji) => addReaction(msg.id, emoji)} />
          ))
        )}
        <div ref={messagesEndRef} />
        <div style={{ height: 8 }} />
      </div>

      {/* ── 下部チャンネルタブ（スマホメイン動線） ── */}
      <div style={{
        borderTop: "1px solid #2e2e30",
        background: "#19171d",
        display: "flex",
        overflowX: "auto",
        flexShrink: 0,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
      }}>
        {CHANNELS.map(c => (
          <button
            key={c.id}
            onClick={() => switchChannel(c.id)}
            style={{
              flex: "0 0 auto",
              padding: "10px 14px 12px",
              background: "none",
              border: "none",
              borderTop: activeChannel === c.id ? "2px solid #1264a3" : "2px solid transparent",
              color: activeChannel === c.id ? "#fff" : "#9b9b9b",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              minWidth: 62,
              position: "relative",
            }}
          >
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <span style={{ fontSize: 9, whiteSpace: "nowrap", fontWeight: activeChannel === c.id ? "bold" : "normal" }}>
              {c.name.length > 6 ? c.name.slice(0, 6) + "…" : c.name}
            </span>
            {!channelMessages[c.id] && c.id !== activeChannel && (
              <div style={{
                position: "absolute", top: 8, right: 10,
                width: 6, height: 6, borderRadius: "50%", background: "#cd2553",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── ダミー入力 ── */}
      <div style={{ padding: "8px 14px 14px", flexShrink: 0, background: "#1a1d21" }}>
        <div style={{
          background: "#22252a",
          border: "1px solid #383838",
          borderRadius: 8,
          padding: "11px 14px",
          color: "#555",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>💼</span>
          <span>#{ch?.name}（閲覧専用）</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3e3e40; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function MessageItem({ msg, onReact }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { char, text, time, reactions, isFixed } = msg;

  return (
    <div style={{
      display: "flex",
      gap: 10,
      marginBottom: 18,
      animation: "fadeIn 0.3s ease",
    }}>
      {/* アバター */}
      <div style={{
        width: 38, height: 38,
        borderRadius: 7,
        background: char.color || "#4a154b",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, color: "white", fontWeight: "bold",
        flexShrink: 0,
        border: isFixed ? `2px solid ${char.color}` : "2px solid transparent",
        boxShadow: isFixed ? `0 0 10px ${char.color}55` : "none",
      }}>{char.avatar}</div>

      {/* 本文エリア */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontWeight: "bold", color: isFixed ? char.color : "#d1d2d3", fontSize: 13 }}>{char.name}</span>
          {isFixed && (
            <span style={{
              fontSize: 9, background: `${char.color}33`, color: char.color,
              padding: "1px 5px", borderRadius: 3, fontWeight: "bold",
            }}>常連</span>
          )}
          <span style={{ fontSize: 10, color: "#555" }}>{char.role} · {timeAgo(time)}</span>
        </div>

        <div style={{
          color: "#d1d2d3", lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14,
        }}>{text}</div>

        {/* リアクション済み */}
        {reactions.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
            {reactions.map(r => (
              <button key={r.emoji} onClick={() => onReact(r.emoji)} style={{
                background: "#2e2e30", border: "1px solid #3e3e40",
                borderRadius: 5, padding: "3px 9px",
                cursor: "pointer", fontSize: 14, color: "#d1d2d3",
                display: "flex", alignItems: "center", gap: 4,
              }}>{r.emoji}<span style={{ fontSize: 12 }}>{r.count}</span></button>
            ))}
          </div>
        )}

        {/* リアクション追加ボタン（タップ操作用・常時表示） */}
        <div style={{ marginTop: 6, position: "relative", display: "inline-block" }}>
          <button
            onClick={() => setShowEmojiPicker(p => !p)}
            style={{
              background: "none", border: "1px solid #383838",
              borderRadius: 5, padding: "3px 8px",
              cursor: "pointer", fontSize: 13, color: "#666",
            }}
          >＋ 😊</button>

          {showEmojiPicker && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 0,
              background: "#22252a",
              border: "1px solid #3e3e40",
              borderRadius: 8,
              padding: "6px 8px",
              display: "flex", gap: 4, flexWrap: "wrap",
              zIndex: 20,
              boxShadow: "0 4px 16px #000a",
              width: 200,
            }}>
              {REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(emoji); setShowEmojiPicker(false); }} style={{
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: 20,
                  padding: "4px 5px", borderRadius: 4,
                }}>{emoji}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
