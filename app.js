/* ── Модель ───────────────────────────────────────────────── */
const NS = "http://www.w3.org/2000/svg";
const NODE_H = 30, ROW_GAP = 58, SIB_GAP = 10, GROUP_GAP = 26;

const byId = new Map();
SANJYRA.forEach(n => byId.set(n.id, { ...n, children: [] }));
byId.forEach(n => { if (n.parent) byId.get(n.parent).children.push(n); });
const root = [...byId.values()].find(n => !n.parent);

/* тереңдик + бутак + өлчөм */
(function walk(n, depth, branch) {
  n.depth = depth;
  n.branch = n.branch || branch;
  n.w = Math.max(56, 20 + n.name.length * 7.4);
  n.h = NODE_H;
  n.children.forEach(c => walk(c, depth + 1, n.branch));
})(root, 0, null);

/* ── Балдарды иреттөө ─────────────────────────────────────────
   Жылдызчалуу (түз ата-тек) бала — ортодо, калгандары эки
   жагына салмагы боюнча бөлүштүрүлөт. Ошентип * сызыгы
   дарактын так ортосунан түз ылдый түшөт. */
(function subW(n) {
  n.children.forEach(subW);
  n.sw = n.children.length
    ? Math.max(n.w, n.children.reduce((s, c) => s + c.sw, 0) + SIB_GAP * (n.children.length - 1))
    : n.w;
})(root);

(function order(n) {
  const star = n.children.find(c => c.star);
  if (star && n.children.length > 2) {
    const rest = n.children.filter(c => c !== star).sort((a, b) => b.sw - a.sw);
    const left = [], right = [];
    let lw = 0, rw = 0;
    rest.forEach(c => { if (lw <= rw) { left.push(c); lw += c.sw; } else { right.push(c); rw += c.sw; } });
    n.children = [...left.reverse(), star, ...right];
  }
  n.children.forEach(order);
})(root);

/* ── Жайгаштыруу ──────────────────────────────────────────── */
let cursor = 0;
(function assignX(n) {
  if (!n.children.length) { n.x = cursor; cursor += n.w + SIB_GAP; return; }
  n.children.forEach(assignX);
  cursor += GROUP_GAP;                       /* үй-бүлөлөрдүн ортосу */
  const star = n.children.find(c => c.star);
  if (star) {
    n.x = star.x + star.w / 2 - n.w / 2;     /* * сызыгы түз болсун */
  } else {
    const a = n.children[0], b = n.children[n.children.length - 1];
    n.x = (a.x + b.x + b.w) / 2 - n.w / 2;
  }
})(root);

byId.forEach(n => { n.y = n.depth * (NODE_H + ROW_GAP); });

const all = [...byId.values()];
const GENS = Math.max(...all.map(n => n.depth)) + 1;
const BB = {
  x0: Math.min(...all.map(n => n.x)) - 40,
  x1: Math.max(...all.map(n => n.x + n.w)) + 40,
  y0: -40,
  y1: Math.max(...all.map(n => n.y + n.h)) + 40
};
const CENTER_X = root.x + root.w / 2;        /* * сызыгынын огу */

/* ── Тартуу ───────────────────────────────────────────────── */
const svg = document.getElementById("tree");
svg.innerHTML =
  `<defs>
     <marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
       <path d="M0 0 L8 4 L0 8 z" fill="var(--cord)"/></marker>
     <marker id="arh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
       <path d="M0 0 L8 4 L0 8 z" fill="var(--accent)"/></marker>
   </defs>
   <g id="vp"><g id="rows"></g><g id="links"></g><g id="nodes"></g></g>`;

const vp = svg.querySelector("#vp");
const gRows = svg.querySelector("#rows");
const gLinks = svg.querySelector("#links");
const gNodes = svg.querySelector("#nodes");
const linkOf = new Map(), elOf = new Map();

/* муундардын катар сызыктары */
for (let d = 0; d < GENS; d++) {
  const y = d * (NODE_H + ROW_GAP) + NODE_H / 2;
  const line = document.createElementNS(NS, "line");
  line.setAttribute("x1", BB.x0); line.setAttribute("x2", BB.x1);
  line.setAttribute("y1", y); line.setAttribute("y2", y);
  line.setAttribute("class", "genline");
  gRows.appendChild(line);
}

byId.forEach(n => {
  if (n.parent) {
    const p = byId.get(n.parent);
    const x1 = p.x + p.w / 2, y1 = p.y + p.h;
    const x2 = n.x + n.w / 2, y2 = n.y - 7;
    const my = (y1 + y2) / 2;
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`);
    path.setAttribute("class", "link" + (n.star ? " star" : ""));
    path.setAttribute("marker-end", "url(#ar)");
    gLinks.appendChild(path);
    linkOf.set(n.id, path);
  }

  const g = document.createElementNS(NS, "g");
  g.dataset.id = n.id;
  g.setAttribute("class",
    "node" + (n.depth === 0 ? " root" : "") + (n.depth === 1 ? " trunk" : "") + (n.star ? " star" : ""));
  g.setAttribute("transform", `translate(${n.x},${n.y})`);
  g.setAttribute("tabindex", "0");
  g.setAttribute("role", "button");
  g.setAttribute("aria-label", n.name);

  const r = document.createElementNS(NS, "rect");
  r.setAttribute("class", "plate");
  r.setAttribute("width", n.w);
  r.setAttribute("height", n.h);
  g.appendChild(r);

  const t = document.createElementNS(NS, "text");
  t.setAttribute("class", "name");
  t.setAttribute("x", n.w / 2);
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("y", n.h / 2 + 1);
  t.textContent = n.name;
  g.appendChild(t);

  g.addEventListener("pointerenter", () => hot(n, true));
  g.addEventListener("pointerleave", () => hot(n, false));
  g.addEventListener("focus", () => hot(n, true));
  g.addEventListener("blur", () => hot(n, false));
  g.addEventListener("click", e => { e.stopPropagation(); select(n); });
  g.addEventListener("keydown", e => { if (e.key === "Enter") select(n); });

  gNodes.appendChild(g);
  elOf.set(n.id, g);
});

/* муун белгилери (экранга байланган) */
const gensBox = document.getElementById("gens");
const genEls = [];
for (let d = 0; d < GENS; d++) {
  const el = document.createElement("span");
  el.textContent = `${d + 1}-муун`;
  gensBox.appendChild(el);
  genEls.push(el);
}

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

function descendants(n) { return n.children.reduce((s, c) => s + 1 + descendants(c), 0); }

function select(n) {
  if (selected) elOf.get(selected.id).classList.remove("sel");
  selected = n;
  elOf.get(n.id).classList.add("sel");

  document.getElementById("pgen").textContent = `${n.depth + 1}-муун`;
  document.getElementById("pkin").innerHTML = `<li>${n.name}</li>`;

  const sibs = n.parent ? byId.get(n.parent).children.filter(c => c !== n) : [];
  document.getElementById("psibs-blk").style.display = sibs.length ? "" : "none";
  document.getElementById("psibs").innerHTML = sibs.map(s => `<li data-go="${s.id}">${s.name}</li>`).join("");

  const path = chain(n);
  document.getElementById("ppath").innerHTML = path
    .map(a => `<li data-go="${a.id}">${a.name}</li>`).join("");
  document.querySelectorAll("#ppath li, #psibs li").forEach(li =>
    li.onclick = () => { const t = byId.get(li.dataset.go); select(t); center(t); });

  document.getElementById("pkids").textContent = n.children.length;
  document.getElementById("pall").textContent = descendants(n);

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

function apply() {
  vp.setAttribute("transform", `translate(${tx},${ty}) scale(${k})`);
  const roomy = (NODE_H + ROW_GAP) * k > 24;   /* тыгыз болсо жашырабыз */
  genEls.forEach((el, d) => {
    const y = ty + (d * (NODE_H + ROW_GAP) + NODE_H / 2) * k;
    el.style.transform = `translateY(${y}px)`;
    el.style.opacity = (roomy && y > topPad() - 10 && y < innerHeight - 8) ? 1 : 0;
  });
}
function topPad() { return innerWidth <= 760 ? 128 : 96; }

/* Баштапкы көрүнүш: бүт муундар бийиктикке батат,
   * сызыгы экрандын так ортосунда */
function home() {
  const H = BB.y1 - BB.y0;
  k = Math.min(1, Math.max(0.42, (innerHeight - topPad() - 24) / H));
  tx = innerWidth / 2 - CENTER_X * k;
  ty = topPad() - BB.y0 * k;
  apply();
}
function fit() {
  const W = BB.x1 - BB.x0, H = BB.y1 - BB.y0;
  k = Math.min(innerWidth / W, (innerHeight - topPad() - 20) / H) * 0.96;
  tx = (innerWidth - W * k) / 2 - BB.x0 * k;
  ty = topPad() - BB.y0 * k;
  apply();
}
function center(n) {
  k = Math.max(k, 0.8);
  tx = innerWidth / 2 - (n.x + n.w / 2) * k;
  ty = innerHeight / 2 - (n.y + n.h / 2) * k;
  apply();
}
function zoomAt(cx, cy, f) {
  const nk = Math.min(3, Math.max(0.08, k * f));
  tx = cx - (cx - tx) * (nk / k);
  ty = cy - (cy - ty) * (nk / k);
  k = nk; apply();
}

stage.addEventListener("wheel", e => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016));
}, { passive: false });

const pts = new Map();
let last = null, pinch = null, moved = false;
stage.addEventListener("pointerdown", e => {
  pts.set(e.pointerId, e);
  stage.setPointerCapture(e.pointerId);
  moved = false;
  if (pts.size === 1) { last = { x: e.clientX, y: e.clientY }; stage.classList.add("dragging"); }
  if (pts.size === 2) pinch = dist();
});
stage.addEventListener("pointermove", e => {
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, e);
  if (pts.size === 2 && pinch) {
    const d = dist(), c = mid();
    zoomAt(c.x, c.y, d / pinch); pinch = d; moved = true; return;
  }
  if (pts.size === 1 && last) {
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    tx += dx; ty += dy;
    last = { x: e.clientX, y: e.clientY }; apply();
  }
});
const up = e => {
  pts.delete(e.pointerId);
  if (pts.size < 2) pinch = null;
  if (!pts.size) {
    last = null; stage.classList.remove("dragging");
    /* Басуу: pointer capture click окуясын түйүнгө жеткирбейт,
       ошондуктан жылбаган басууда түйүндү өзүбүз табабыз */
    if (!moved) {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const g = t && t.closest ? t.closest(".node") : null;
      if (g) select(byId.get(g.dataset.id));
    }
  }
};
stage.addEventListener("pointerup", up);
stage.addEventListener("pointercancel", up);
function two() { return [...pts.values()]; }
function dist() { const [a, b] = two(); return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
function mid() { const [a, b] = two(); return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; }

document.getElementById("zin").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1.3);
document.getElementById("zout").onclick = () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.3);
document.getElementById("zfit").onclick = fit;
document.getElementById("zhome").onclick = home;
let touched = false;
["wheel", "pointerdown"].forEach(ev => stage.addEventListener(ev, () => { touched = true; }));
addEventListener("resize", () => { if (!touched) home(); else apply(); });

/* ── Издөө ───────────────────────────────────────────────── */
const q = document.getElementById("q"), qc = document.getElementById("qcount");
q.addEventListener("input", () => {
  const v = q.value.trim().toLowerCase();
  let hits = [];
  byId.forEach(n => {
    const el = elOf.get(n.id);
    const m = v && n.name.toLowerCase().includes(v);
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
      const off = b !== "all" && n.branch !== b && n.depth > 0;
      elOf.get(n.id).classList.toggle("dim", off);
      const l = linkOf.get(n.id); if (l) l.classList.toggle("dim", off);
    });
  };
});

home();
