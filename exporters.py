:root {
  --bg: #0f172a;
  --panel: #111827;
  --panel-2: #1f2937;
  --text: #e5e7eb;
  --muted: #94a3b8;
  --accent: #22c55e;
  --danger: #ef4444;
  --border: #334155;
}
body {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  background: linear-gradient(180deg, #0b1120, #111827);
  color: var(--text);
}
.container {
  width: min(1100px, 92vw);
  margin: 32px auto 48px;
}
.hero { margin-bottom: 24px; }
.hero h1 { margin-bottom: 8px; }
.card {
  background: rgba(17, 24, 39, 0.92);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 22px;
  margin-bottom: 24px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.28);
}
label, select, input, button { display: block; width: 100%; }
label { margin: 10px 0 8px; color: var(--muted); }
select, input[type=file] {
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}
button, .button {
  margin-top: 16px;
  background: var(--accent);
  color: #052e16;
  border: 0;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 700;
  text-decoration: none;
  display: inline-block;
  width: auto;
  cursor: pointer;
}
button.danger { background: var(--danger); color: white; }
.hint, p { color: var(--muted); }
.row { display: flex; gap: 16px; align-items: center; }
.between { justify-content: space-between; }
.actions { display: flex; gap: 12px; align-items: center; }
.stats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: #0b1220;
  border: 1px solid var(--border);
}
.file-card {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  margin-top: 14px;
}
.downloads { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
.downloads a { color: #86efac; }
pre {
  white-space: pre-wrap;
  background: #0b1220;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  overflow-x: auto;
}
@media (max-width: 768px) {
  .row, .actions { flex-direction: column; align-items: stretch; }
}
