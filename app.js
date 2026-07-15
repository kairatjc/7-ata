/* ── Модель ───────────────────────────────────────────────── */
const NS = "http://www.w3.org/2000/svg";
const TILE_W = 152, LINE_H = 16, PAD_Y = 11, ROW_GAP = 74, COL_GAP = 22;

const byId = new Map();
SANJYRA.forEach(n => byId.set(n.id, { ...n, children: [] }));
SANJYRA.forEach(n => { if (n.parent) byId.get(n.parent).children.push(byId.get(n.id)); });
const root = byId.get("nogoi");

/* тереңдик + бутак + бийиктик */
(function walk(n, depth, branch) {
  n.depth = depth;
  n.branch = n.branch || branch;
  n.h = PAD_Y * 2 + n.names.length * LINE_H;
  n.children.forEach(c => walk(c, depth + 1, n.branch));
})(root, 0, null);

/* ── Жайгаштыруу ──────────────────────────────────────────── */
let cursor = 0;
(function assignX(n) {
  if (!n.children.length) { n.x = cursor; cursor += TILE_W + COL_GAP; return; }
  n.children.forEach(assignX);
  n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2;
})(root);

const rowTop = [], rowH = [];
byId.forEach(n => { rowH[n.depth] = Math.max(rowH[n.depth] || 0, n.h); });
rowH.reduce((acc, h, i) => (rowTop[i] = acc, acc + h + ROW_GAP), 0);
byId.forEach(n => { n.y = rowTop[n.depth]; });

const xs = [...byId.values()];
const BB = {
  x0: Math.min(...xs.map(n => n.x)) - 60,
  x1: Math.max(...xs.map(n => n.x)) + TILE_W + 60,
  y0: -60,
  y1: Math.max(...xs.map(n => n.y + n.h)) + 60
};

/* ── Тартуу ───────────────────────────────────────────────── */
const svg = document.getElementById("tree");
svg.innerHTML =
  `<defs>
     <marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
       <path d="M0 0 L8 4 L0 8 z" fill="var(--cord)"/></marker>
     <marker id="arh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
       <path d="M0 0 L8 4 L0 8 z" fill="var(--accent)"/></marker>
   </defs>
   <g id="vp"><g id="links"></g><g id="nodes"></g></g>`;

const vp = svg.querySelector("#vp");
const gLinks = svg.querySelector("#links");
const gNodes = svg.querySelector("#nodes");
const linkOf = new Map(), elOf = new Map();

byId.forEach(n => {
  if (n.parent) {
    const p = byId.get(n.parent);
    const x1 = p.x + TILE_W / 2, y1 = p.y + p.h;
    const x2 = n.x + TILE_W / 2, y2 = n.y - 7;
    const my = (y1 + y2) / 2;
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`);
    path.setAttribute("class", "link");
    path.setAttribute("marker-end", "url(#ar)");
    gLinks.appendChild(path);
    linkOf.set(n.id, path);
  }

  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "node" + (n.root ? " root" : "") + (n.depth === 1 ? " trunk" : ""));
  g.setAttribute("transform", `translate(${n.x},${n.y})`);
  g.setAttribute("tabindex", "0");
  g.setAttribute("role", "button");
  g.setAttribute("aria-label", n.names.join(", "));

  const r = document.createElementNS(NS, "rect");
  r.setAttribute("class", "plate");
  r.setAttribute("width", TILE_W);
  r.setAttribute("height", n.h);
  g.appendChild(r);

  n.names.forEach((nm, i) => {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("class", "name");
    t.setAttribute("x", n.root || n.depth === 1 ? TILE_W / 2 : 12);
    t.setAttribute("text-anchor", n.root || n.depth === 1 ? "middle" : "start");
    t.setAttribute("y", PAD_Y + i * LINE_H + LINE_H / 2);
    t.textContent = nm;
    g.appendChild(t);
  });

  g.addEventListener("pointerenter", () => hot(n, true));
  g.addEventListener("pointerleave", () => hot(n, false));
  g.addEventListener("focus", () => hot(n, true));
  g.addEventListener("blur", () => hot(n, false));
  g.addEventListener("click", e => { e.stopPropagation(); select(n); });
  g.addEventListener("keydown", e => { if (e.key === "Enter") select(n); });

  gNodes.appendChild(g);
  elOf.set(n.id, g);
});

/* ── Ата-тек жолун жарык кылуу ───────────────────────────── */
function chain(n) { const c = []; for (let k = n; k; k = k.parent ? byId.get(k.parent) : null) c.push(k); return c.reverse(); }

function hot(n, on) {
  chain(n).forEach(a => {
    elOf.get(a.id).classList.toggle("hot", on);
    const l = linkOf.get(a.id);
    if (l) { l.classList.toggle("hot", on); l.setAttribute("marker-end", on ? "url(#arh)" : "url(#ar)"); }
  });
}

/* ── Панель ──────────────────────────────────────────────── */
const panel = document.getElementById("panel");
let selected = null;

function subtree(n) { return 1 + n.children.reduce((s, c) => s + subtree(c), 0); }
function men(n) { return n.names.length + n.children.reduce((s, c) => s + men(c), 0); }

function select(n) {
  if (selected) elOf.get(selected.id).classList.remove("sel");
  selected = n;
  elOf.get(n.id).classList.add("sel");

  document.getElementById("pgen").textContent = `${n.depth + 1}-муун`;
  document.getElementById("pkin").innerHTML = n.names.map(x => `<li>${x}</li>`).join("");

  const path = chain(n);
  document.getElementById("ppath").innerHTML = path
    .map(a => `<li data-go="${a.id}">${a.names.join(", ")}</li>`).join("");
  document.querySelectorAll("#ppath li").forEach(li =>
    li.onclick = () => { const t = byId.get(li.dataset.go); select(t); center(t); });

  document.getElementById("pkids").textContent = n.children.reduce((s, c) => s + c.names.length, 0);
  document.getElementById("pall").textContent = men(n) - n.names.length;

  panel.classList.add("open");
}
document.getElementById("pclose").onclick = () => {
  panel.classList.remove("open");
  if (selected) elOf.get(selected.id).classList.remove("sel");
  selected = null;
};

/* ── Жылдыруу жана масштаб ───────────────────────────────── */
const stage = document.getElementById("stage");
let k = 1, tx = 0, ty = 0;
const apply = () => vp.setAttribute("transform", `translate(${tx},${ty}) scale(${k})`);

function fit() {
  const w = innerWidth, h = innerHeight;
  const W = BB.x1 - BB.x0, H = BB.y1 - BB.y0;
  k = Math.min(w / W, (h - 110) / H) * 0.94;
  tx = (w - W * k) / 2 - BB.x0 * k;
  ty = 96 - BB.y0 * k;
  apply();
}
function center(n) {
  k = Math.max(k, 0.75);
  tx = innerWidth / 2 - (n.x + TILE_W / 2) * k;
  ty = innerHeight / 2 - (n.y + n.h / 2) * k;
  apply();
}
function zoomAt(cx, cy, f) {
  const nk = Math.min(3, Math.max(0.12, k * f));
  tx = cx - (cx - tx) * (nk / k);
  ty = cy - (cy - ty) * (nk / k);
  k = nk; apply();
}

stage.addEventListener("wheel", e => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016));
}, { passive: false });

const pts = new Map();
let last = null, pinch = null;
stage.addEventListener("pointerdown", e => {
  pts.set(e.pointerId, e);
  stage.setPointerCapture(e.pointerId);
  if (pts.size === 1) { last = { x: e.clientX, y: e.clientY }; stage.classList.add("dragging"); }
  if (pts.size === 2) pinch = dist();
});
stage.addEventListener("pointermove", e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, e);
  if (pts.size === 2 && pinch) {
    const d = dist(), c = mid();
    zoomAt(c.x, c.y, d / pinch); pinch = d; return;
  }
  if (pts.size === 1 && last) {
    tx += e.clientX - last.x; ty += e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY }; apply();
  }
});
const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { last = null; stage.classList.remove("dragging"); } };
stage.addEventListener("pointerup", up);
stage.addEventListener("pointercancel", up);
function two() { return [...pts.values()]; }
function dist() { const [a, b] = two(); return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
function mid() { const [a, b] = two(); return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; }

document.getElementById("zin").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1.3);
document.getElementById("zout").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.3);
document.getElementById("zfit").onclick = fit;
addEventListener("resize", () => { if (k === 1) fit(); });

/* ── Издөө ───────────────────────────────────────────────── */
const q = document.getElementById("q"), qc = document.getElementById("qcount");
q.addEventListener("input", () => {
  const v = q.value.trim().toLowerCase();
  let hits = [];
  byId.forEach(n => {
    const el = elOf.get(n.id);
    const m = v && n.names.some(x => x.toLowerCase().includes(v));
    el.classList.toggle("hit", !!m);
    if (m) hits.push(n);
  });
  qc.textContent = v ? (hits.length || "0") : "";
  if (hits.length) center(hits[0]);
});

/* ── Бутак чыпкасы ───────────────────────────────────────── */
document.querySelectorAll(".chip").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".chip").forEach(b => b.classList.toggle("on", b === btn));
    const b = btn.dataset.branch;
    byId.forEach(n => {
      const off = b !== "all" && n.branch !== b && !n.root;
      elOf.get(n.id).classList.toggle("dim", off);
      const l = linkOf.get(n.id); if (l) l.classList.toggle("dim", off);
    });
  };
});

fit();
