/* ── Модель ───────────────────────────────────────────────── */
const NS = "http://www.w3.org/2000/svg";
const NODE_H = 30, ROW_GAP = 58, SIB_GAP = 10, GROUP_GAP = 26, ICON_PAD = 22;

const byId = new Map();
SANJYRA.forEach(n => byId.set(n.id, { ...n, children: [] }));
byId.forEach(n => { if (n.parent) byId.get(n.parent).children.push(n); });
const root = [...byId.values()].find(n => !n.parent);

/* туруктуу өлчөм жана бутак-белги (тереңдикке көз каранды эмес,
   бир жолу гана эсептелет) */
byId.forEach(n => {
  n.h = NODE_H;
  n.baseW = Math.max(56, 20 + n.name.length * 7.4) + (n.kind ? ICON_PAD : 0);
});
/* тамыр түйүн чоңураак/калың арип менен тартылат (.node.root .name) —
   узунураак атка жетиштүү орун калсын үчүн кутучасын кеңейтебиз */
root.baseW += 34;
(function walkBranch(n, branch) {
  n.branch = n.branch || branch;
  n.children.forEach(c => walkBranch(c, n.branch));
})(root, null);

function descendants(n) { return n.children.reduce((s, c) => s + 1 + descendants(c), 0); }
function realParent(n) { return n.parent ? byId.get(n.parent) : null; }
function chain(n) { const c = []; for (let k = n; k; k = realParent(k)) c.push(k); return c.reverse(); }

/* ── 4-тапшырма: Долон бийден Ногойго чейинки чынжырды бүктөө ─
   "Долон Бий" (кошулбайт) ... "Ногой" (кошулбайт) аралыгы бир
   баскыч менен катары бүт жашырылат/ачылат. */
const ANCESTOR_FROM = "dolon", ANCESTOR_TO = "n1";
let ancestorsCollapsed = true;

const segmentIds = new Set();
(function () {
  let cur = realParent(byId.get(ANCESTOR_TO));
  while (cur && cur.id !== ANCESTOR_FROM) { segmentIds.add(cur.id); cur = realParent(cur); }
})();
const noToggle = new Set([ANCESTOR_FROM, ...segmentIds]);

/* ── 3-тапшырма: кызыл сызыкта жок бутактарды жеке жашыруу ──── */
const collapsed = new Set();
byId.forEach(n => { if (!n.star && n.children.length) collapsed.add(n.id); });

function kids(n) {
  if (n.id === ANCESTOR_FROM && ancestorsCollapsed) return [byId.get(ANCESTOR_TO)];
  if (collapsed.has(n.id)) return [];
  return n.children;
}
function effParent(n) {
  if (n.id === ANCESTOR_TO && ancestorsCollapsed) return byId.get(ANCESTOR_FROM);
  return realParent(n);
}
function toggleCollapse(id) { collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); render(); }

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
const gensBox = document.getElementById("gens");
let linkOf = new Map(), elOf = new Map(), genEls = [];
let BB = null, CENTER_X = 0, GENS = 0;

function render() {
  /* тереңдик + өлчөм (көрүнгөн түйүндөр гана) */
  const visible = [];
  (function walk(n, depth) {
    n.depth = depth;
    n.w = n.baseW;
    n.y = depth * (NODE_H + ROW_GAP);
    visible.push(n);
    kids(n).forEach(c => walk(c, depth + 1));
  })(root, 0);

  (function subW(n) {
    const ch = kids(n);
    ch.forEach(subW);
    n.sw = ch.length
      ? Math.max(n.w, ch.reduce((s, c) => s + c.sw, 0) + SIB_GAP * (ch.length - 1))
      : n.w;
  })(root);

  /* Жылдызчалуу (түз ата-тек) бала — сол жакта, so ал сызык
     туш келди сол четинде түз ылдый түшөт. Калган бутактар оң
     жакка, эң кичинекейи жылдыздын жанына, чоңураагы андан ары
     жылдырылат — бош орун талап кылганда гана алысыраак турат. */
  (function order(n) {
    const ch = kids(n);
    if (ch === n.children && ch.length > 1) {
      const star = n.children.find(c => c.star);
      if (star) {
        const rest = n.children.filter(c => c !== star).sort((a, b) => a.sw - b.sw);
        n.children = [star, ...rest];
      }
    }
    kids(n).forEach(order);
  })(root);

  let cursor = 0;
  (function assignX(n) {
    const ch = kids(n);
    if (!ch.length) { n.x = cursor; cursor += n.w + SIB_GAP; return; }
    ch.forEach(assignX);
    cursor += GROUP_GAP;
    const star = ch.find(c => c.star);
    if (star) {
      n.x = star.x + star.w / 2 - n.w / 2;
    } else {
      const a = ch[0], b = ch[ch.length - 1];
      n.x = (a.x + b.x + b.w) / 2 - n.w / 2;
    }
  })(root);

  GENS = Math.max(...visible.map(n => n.depth)) + 1;
  BB = {
    x0: Math.min(...visible.map(n => n.x)) - 40,
    x1: Math.max(...visible.map(n => n.x + n.w)) + 40,
    y0: -40,
    y1: Math.max(...visible.map(n => n.y + n.h)) + 40
  };
  CENTER_X = root.x + root.w / 2;

  gRows.innerHTML = ""; gLinks.innerHTML = ""; gNodes.innerHTML = "";
  linkOf = new Map(); elOf = new Map();

  for (let d = 0; d < GENS; d++) {
    const y = d * (NODE_H + ROW_GAP) + NODE_H / 2;
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", BB.x0); line.setAttribute("x2", BB.x1);
    line.setAttribute("y1", y); line.setAttribute("y2", y);
    line.setAttribute("class", "genline");
    gRows.appendChild(line);
  }

  visible.forEach(n => {
    const p = effParent(n);
    if (p) {
      const bypass = n.id === ANCESTOR_TO && ancestorsCollapsed;
      const x1 = p.x + p.w / 2, y1 = p.y + p.h;
      const x2 = n.x + n.w / 2, y2 = n.y - 7;
      const my = (y1 + y2) / 2;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`);
      path.setAttribute("class", "link" + (n.star ? " star" : "") + (bypass ? " bypass" : ""));
      path.setAttribute("marker-end", "url(#ar)");
      gLinks.appendChild(path);
      linkOf.set(n.id, path);

      if (bypass) {
        const label = document.createElementNS(NS, "text");
        label.setAttribute("x", (x1 + x2) / 2 + 10);
        label.setAttribute("y", my);
        label.setAttribute("class", "bypass-label");
        label.textContent = `⋯ ${segmentIds.size} муун жашырылды`;
        gLinks.appendChild(label);
      }
    }

    const g = document.createElementNS(NS, "g");
    g.dataset.id = n.id;
    g.setAttribute("class",
      "node" + (n === root ? " root" : "") + (n.id === "n1" ? " trunk" : "") +
      (n.star ? " star" : "") + (n.kind ? " " + n.kind : ""));
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
    t.setAttribute("y", n.h / 2 + 1);
    if (n.kind) {
      const icon = document.createElementNS(NS, "text");
      icon.setAttribute("class", "icon");
      icon.setAttribute("x", 11);
      icon.setAttribute("y", n.h / 2 + 1);
      icon.setAttribute("text-anchor", "middle");
      icon.textContent = n.kind === "tribe" ? "⛺" : "♛";
      g.appendChild(icon);
      t.setAttribute("x", 22);
      t.setAttribute("text-anchor", "start");
    } else {
      t.setAttribute("x", n.w / 2);
      t.setAttribute("text-anchor", "middle");
    }
    t.textContent = n.name;
    g.appendChild(t);

    g.addEventListener("pointerenter", () => hot(n, true));
    g.addEventListener("pointerleave", () => hot(n, false));
    g.addEventListener("focus", () => hot(n, true));
    g.addEventListener("blur", () => hot(n, false));
    g.addEventListener("click", e => { if (e.target.closest(".toggle")) return; e.stopPropagation(); select(n); });
    g.addEventListener("keydown", e => { if (e.key === "Enter") select(n); });

    if (n.children.length && !noToggle.has(n.id)) {
      const isClosed = collapsed.has(n.id);
      const tg = document.createElementNS(NS, "g");
      tg.setAttribute("class", "toggle" + (isClosed ? " closed" : " open"));
      tg.setAttribute("transform", `translate(${n.w / 2},${n.h + 9})`);
      const tc = document.createElementNS(NS, "circle");
      tc.setAttribute("r", 8);
      tg.appendChild(tc);
      const tt = document.createElementNS(NS, "text");
      tt.setAttribute("text-anchor", "middle");
      tt.setAttribute("y", 3.5);
      tt.textContent = isClosed ? "+" : "–";
      tg.appendChild(tt);
      const title = document.createElementNS(NS, "title");
      title.textContent = (isClosed ? "Ачуу" : "Жашыруу") + ` (${descendants(n)} урпак)`;
      tg.appendChild(title);
      /* Чыныгы басуу төмөндөгү #stage pointerup четтетүүсү аркылуу гана
         иштейт (pointer capture "click" окуясын түйүнгө жеткирбейт),
         ошондуктан бул жерде өзүнчө click угузгуч кошулбайт —
         кош которулуудан сактоо үчүн */
      g.appendChild(tg);
    }

    gNodes.appendChild(g);
    elOf.set(n.id, g);
  });

  gensBox.innerHTML = ""; genEls = [];
  for (let d = 0; d < GENS; d++) {
    const el = document.createElement("span");
    el.textContent = `${d + 1}-муун`;
    gensBox.appendChild(el);
    genEls.push(el);
  }

  applyBranchFilter();
  apply();
}

/* ── Ата-тек жолун жарык кылуу ───────────────────────────── */
function hot(n, on) {
  chain(n).forEach(a => {
    const el = elOf.get(a.id);
    if (el) el.classList.toggle("hot", on);
    const l = linkOf.get(a.id);
    if (l) { l.classList.toggle("hot", on); l.setAttribute("marker-end", on ? "url(#arh)" : "url(#ar)"); }
  });
}

/* ── Панель ──────────────────────────────────────────────── */
const panel = document.getElementById("panel");
let selected = null;

const KIND_LABEL = { tribe: "Уруунун аты", leader: "Уруу башчысы / атактуу инсан" };

function select(n) {
  if (selected) { const prevEl = elOf.get(selected.id); if (prevEl) prevEl.classList.remove("sel"); }
  selected = n;
  const el = elOf.get(n.id); if (el) el.classList.add("sel");

  document.getElementById("pgen").textContent = `${n.depth + 1}-муун`;
  document.getElementById("pkin").innerHTML = `<li>${n.name}</li>` +
    (n.kind ? `<li class="tag">${KIND_LABEL[n.kind]}</li>` : "");

  const descEl = document.getElementById("pdesc");
  if (n.desc) { descEl.textContent = n.desc; descEl.style.display = ""; }
  else { descEl.style.display = "none"; }

  const sibs = n.parent ? byId.get(n.parent).children.filter(c => c !== n) : [];
  document.getElementById("psibs-blk").style.display = sibs.length ? "" : "none";
  document.getElementById("psibs").innerHTML = sibs.map(s => `<li data-go="${s.id}">${s.name}</li>`).join("");

  const path = chain(n);
  document.getElementById("ppath").innerHTML = path
    .map(a => `<li data-go="${a.id}">${a.name}</li>`).join("");
  document.querySelectorAll("#ppath li, #psibs li").forEach(li =>
    li.onclick = () => revealAndGoto(byId.get(li.dataset.go)));

  document.getElementById("pkids").textContent = n.children.length;
  document.getElementById("pall").textContent = descendants(n);

  const expandBtn = document.getElementById("pexpand");
  if (n.children.length && collapsed.has(n.id)) {
    expandBtn.style.display = "";
    expandBtn.textContent = `Бутакты ачуу (${descendants(n)})`;
    expandBtn.onclick = () => { collapsed.delete(n.id); render(); select(n); };
  } else {
    expandBtn.style.display = "none";
  }

  panel.classList.add("open");
}
document.getElementById("pclose").onclick = () => {
  panel.classList.remove("open");
  if (selected) { const el = elOf.get(selected.id); if (el) el.classList.remove("sel"); }
  selected = null;
};

/* Жашырылган бутактагы/чынжырдагы түйүнгө өтүү: керек болсо ачат */
function revealAndGoto(n) {
  let dirty = false;
  for (let a = realParent(n); a; a = realParent(a)) {
    if (collapsed.delete(a.id)) dirty = true;
  }
  if (ancestorsCollapsed && chain(n).some(a => segmentIds.has(a.id))) {
    ancestorsCollapsed = false; dirty = true; syncAnctoggle();
  }
  if (dirty) render();
  select(n);
  center(n);
}

/* ── Ата-баба чынжырын ачуу/жашыруу баскычы ─────────────────── */
const anctoggle = document.getElementById("anctoggle");
function syncAnctoggle() {
  anctoggle.classList.toggle("on", !ancestorsCollapsed);
  anctoggle.textContent = ancestorsCollapsed
    ? `Ата-бабаларды ачуу (${segmentIds.size})`
    : "Ата-бабаларды жашыруу";
}
anctoggle.addEventListener("click", () => {
  ancestorsCollapsed = !ancestorsCollapsed;
  syncAnctoggle();
  render();
});
syncAnctoggle();

/* ── Жылдыруу жана масштаб ───────────────────────────────── */
const stage = document.getElementById("stage");
let k = 1, tx = 0, ty = 0;

function apply() {
  vp.setAttribute("transform", `translate(${tx},${ty}) scale(${k})`);
  const roomy = (NODE_H + ROW_GAP) * k > 24;
  genEls.forEach((el, d) => {
    const y = ty + (d * (NODE_H + ROW_GAP) + NODE_H / 2) * k;
    el.style.transform = `translateY(${y}px)`;
    el.style.opacity = (roomy && y > topPad() - 10 && y < innerHeight - 8) ? 1 : 0;
  });
}
function topPad() { return innerWidth <= 760 ? 128 : 96; }

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
    if (!moved) {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const tgHit = t && t.closest ? t.closest(".toggle") : null;
      if (tgHit) {
        const g = tgHit.closest(".node");
        if (g) toggleCollapse(g.dataset.id);
      } else {
        const g = t && t.closest ? t.closest(".node") : null;
        if (g) select(byId.get(g.dataset.id));
      }
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
    if (el) el.classList.toggle("hit", !!m);
    if (m) hits.push(n);
  });
  qc.textContent = v ? (hits.length || "0") : "";
  if (hits.length) revealAndGoto(hits[0]);
});

/* ── Бутак чыпкасы ───────────────────────────────────────── */
let branchFilter = "all";
function applyBranchFilter() {
  byId.forEach(n => {
    /* n.branch == null — жалпы ата-баба (ортоктош багыт), эч качан
       көмүскөлөнбөйт; бутакка таандык болгондо гана дал келбесе өчөт */
    const off = branchFilter !== "all" && n.branch != null && n.branch !== branchFilter;
    const el = elOf.get(n.id); if (el) el.classList.toggle("dim", off);
    const l = linkOf.get(n.id); if (l) l.classList.toggle("dim", off);
  });
}
document.querySelectorAll(".chip[data-branch]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".chip[data-branch]").forEach(b => b.classList.toggle("on", b === btn));
    branchFilter = btn.dataset.branch;
    applyBranchFilter();
  };
});

render();
home();
