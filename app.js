/* ── Модель ───────────────────────────────────────────────── */
const ROOT_ID = "dolon";
const ANCESTOR_FROM = "dolon", ANCESTOR_TO = "n1";

let nodes, byId, childMap, segmentIds, segmentIdSet;

function buildData() {
  nodes = SANJYRA.map(n => ({ ...n, star: !!n.star, kind: n.kind || null, branch: n.branch || null, desc: n.desc || null }));
  byId = {}; childMap = {};
  nodes.forEach(n => { byId[n.id] = n; childMap[n.id] = []; });
  nodes.forEach(n => { if (n.parent) childMap[n.parent].push(n); });
  // star child first within each parent
  Object.values(childMap).forEach(a => a.sort((x, y) => (y.star ? 1 : 0) - (x.star ? 1 : 0)));
  // gen number (1-based), branch inheritance
  nodes.forEach(n => {
    let g = 1, p = n; while (p.parent) { g++; p = byId[p.parent]; } n.gen = g;
    let b = null, q = n; while (q) { if (q.branch) { b = q.branch; break; } q = q.parent ? byId[q.parent] : null; } n._branch = b;
  });
  const sub = id => { let c = 0; for (const k of childMap[id]) c += 1 + sub(k.id); return c; };
  nodes.forEach(n => { n._sub = sub(n.id); n._kids = childMap[n.id].length; });

  // ancestor chain hidden by default: everyone strictly between ANCESTOR_FROM and ANCESTOR_TO
  segmentIds = [];
  let cur = byId[ANCESTOR_TO].parent ? byId[byId[ANCESTOR_TO].parent] : null;
  while (cur && cur.id !== ANCESTOR_FROM) { segmentIds.push(cur.id); cur = cur.parent ? byId[cur.parent] : null; }
  segmentIdSet = new Set(segmentIds);
}

/* ── Абалы ────────────────────────────────────────────────── */
let expanded, ancExpanded, filter, selected, matches, chain, cam, nodeEls;
let visible, bbox, worldW, genEls, spineCenterX;
const rowH = 92, topPad = 118;
const mctx = document.createElement("canvas").getContext("2d");

let el_app, el_viewport, el_world, el_svg, el_gens, el_nodes, el_knot,
  el_header, el_search, el_count, el_chips, el_anc, el_panel, el_pbody, el_scrim;

function captureEls() {
  el_app = document.getElementById("app");
  el_viewport = document.getElementById("viewport");
  el_world = document.getElementById("world");
  el_svg = document.getElementById("links");
  el_gens = document.getElementById("gens");
  el_nodes = document.getElementById("nodes");
  el_knot = document.getElementById("knotlayer");
  el_header = document.getElementById("bar");
  el_search = document.getElementById("search");
  el_count = document.getElementById("mcount");
  el_chips = document.getElementById("chips");
  el_anc = document.getElementById("ancbtn");
  el_panel = document.getElementById("panel");
  el_pbody = document.getElementById("pbody");
  el_scrim = document.getElementById("scrim");
}

/* ── Көрүнгөн бутактар ───────────────────────────────────── */
function visChildren(n) {
  if (!expanded.has(n.id)) return [];
  if (n.id === ANCESTOR_FROM && !ancExpanded) return [byId[ANCESTOR_TO]];
  return childMap[n.id];
}

function computeVisible() {
  const list = []; const root = byId[ROOT_ID];
  const walk = (n, depth, vp, ancEdge) => {
    n._depth = depth; n._vp = vp; n._ancEdge = ancEdge; list.push(n);
    visChildren(n).forEach(k => walk(k, depth + 1, n, (n.id === ANCESTOR_FROM && k.id === ANCESTOR_TO && !ancExpanded)));
  };
  walk(root, 0, null, false);
  return list;
}

/* ── Жайгаштыруу ─────────────────────────────────────────── */
function tileW(n) {
  const f = n.id === ROOT_ID ? '700 18px "PT Serif"'
    : n.star ? '700 13.5px "PT Sans"'
    : n.kind === "tribe" ? 'italic 13.5px "PT Sans"' : '400 13.5px "PT Sans"';
  mctx.font = f;
  const w = mctx.measureText(n.name).width;
  let pad = n.id === ROOT_ID ? 52 : 24;
  if (n.kind) pad += 24; // icon + gap
  return Math.max(58, Math.min(220, Math.round(w + pad)));
}

function layout() {
  visible = computeVisible();
  visible.forEach(n => { n._w = tileW(n); n._h = n.id === ROOT_ID ? 44 : 34; });
  // Spine (unbroken red-line chain from root) pinned to a fixed left column.
  // Every other node hugs just right of the spine, packed per-row; an expanded
  // branch reserves its own rows' width, so it only pushes right when opened.
  const isSpine = n => { let p = n; while (p) { if (!p.star) return false; p = p.parent ? byId[p.parent] : null; } return true; };
  const maxHalf = Math.max(...visible.map(n => n._w)) / 2;
  const spineCenter = maxHalf + 40;
  spineCenterX = spineCenter;
  const gap = 16; const rowCursor = {};
  const place = n => {
    const d = n._depth;
    const parentCx = n._vp ? n._vp._cx : spineCenter;
    const leftEdge = rowCursor[d] != null ? rowCursor[d] : (spineCenter + maxHalf + gap);
    n._cx = isSpine(n) ? spineCenter : Math.max(leftEdge + n._w / 2, parentCx);
    rowCursor[d] = n._cx + n._w / 2 + gap;
    visChildren(n).forEach(place);
  };
  place(byId[ROOT_ID]);
  let minX = 1e9, maxX = -1e9, maxD = 0;
  visible.forEach(n => { n._y = n._depth * rowH + topPad;
    minX = Math.min(minX, n._cx - n._w / 2); maxX = Math.max(maxX, n._cx + n._w / 2); maxD = Math.max(maxD, n._depth); });
  bbox = { minX, maxX, minY: topPad, maxY: maxD * rowH + topPad + 44, maxD };
  worldW = maxX + 80;
}

function ico(kind) {
  if (kind === "leader") return '<svg class="ni k" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M5 18 L12 5 L19 18 Z"/><path d="M5 18 L19 18"/><path d="M12 5 L12 18"/></svg>';
  if (kind === "tribe") return '<svg class="ni t" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M4 19 L4 12 Q12 3 20 12 L20 19"/><path d="M4 19 L20 19"/><path d="M12 6 L12 19"/></svg>';
  return "";
}

function buildNodes() {
  const host = el_nodes; host.innerHTML = ""; nodeEls = {};
  visible.forEach(n => {
    const el = document.createElement("div");
    let cls = "node";
    if (n.id === ROOT_ID) cls += " root";
    if (n.star) cls += " star";
    if (n.kind === "leader") cls += " leader";
    if (n.kind === "tribe") cls += " tribe";
    const kids = childMap[n.id].length > 0 && n.id !== ROOT_ID;
    const isExp = expanded.has(n.id);
    if (kids && !isExp) cls += " collapsed";
    el.className = cls;
    el.style.left = (n._cx - n._w / 2) + "px";
    el.style.top = n._y + "px";
    el.style.width = n._w + "px";
    el.dataset.id = n.id;
    el.innerHTML = ico(n.kind) + '<span class="nm">' + n.name + "</span>";
    if (kids) {
      const t = document.createElement("div");
      t.className = "tgl " + (isExp ? "minus" : "plus");
      t.dataset.tgl = n.id;
      t.innerHTML = isExp ? '<span class="pc">－</span>' : '<span class="pc">＋</span> ' + n._sub;
      el.appendChild(t);
    }
    host.appendChild(el);
    nodeEls[n.id] = el;
  });
  // content-fit pass: never clip a name (covers root + compound names)
  visible.forEach(n => {
    const el = nodeEls[n.id]; const nm = el.querySelector(".nm"); if (!nm) return;
    const need = nm.scrollWidth + (el.clientWidth - nm.clientWidth) + 2;
    if (need > el.clientWidth) { n._w = Math.ceil(need + (n.id === ROOT_ID ? 36 : 24) - 24); el.style.width = n._w + "px"; el.style.left = (n._cx - n._w / 2) + "px"; }
  });
}

function buildGens() {
  const host = el_gens; host.innerHTML = "";
  const byDepth = {};
  visible.forEach(n => { (byDepth[n._depth] = byDepth[n._depth] || []).push(n); });
  genEls = [];
  Object.keys(byDepth).forEach(d => {
    const y = (+d) * rowH + topPad - 14;
    const g = Math.min(...byDepth[d].map(n => n.gen));
    const line = document.createElement("div");
    line.className = "genline"; line.style.top = y + "px"; line.style.width = worldW + "px";
    host.appendChild(line);
    const lab = document.createElement("div");
    lab.className = "genlab"; lab.style.top = y + "px"; lab.style.left = (bbox.minX - 14) + "px";
    lab.style.transform = "translate(-100%,-50%)";
    lab.textContent = g + "-муун";
    host.appendChild(lab); genEls.push(lab);
  });
}

function drawLinks() {
  const svg = el_svg;
  svg.setAttribute("width", worldW);
  svg.setAttribute("height", bbox.maxY + 40);
  let s = "";
  el_knot.innerHTML = "";
  visible.forEach(n => {
    const p = n._vp; if (!p) return;
    const x1 = p._cx, y1 = p._y + p._h, x2 = n._cx, y2 = n._y;
    const my = (y1 + y2) / 2;
    const d = `M${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
    const bothStar = p.star && n.star;
    const active = chain.has(n.id) && chain.has(p.id);
    if (n._ancEdge) {
      s += `<path d="${d}" fill="none" stroke="#C7A344" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round" opacity="0.85"/>`;
      const k = document.createElement("div"); k.className = "knot";
      k.style.left = x2 + "px"; k.style.top = my + "px"; k.dataset.action = "anc";
      k.innerHTML = '<div class="dia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div><div class="kl">⋯ ' + segmentIds.length + ' муун жашырылды</div>';
      el_knot.appendChild(k);
    } else if (active) {
      s += `<path d="${d}" fill="none" stroke="#E0C56E" stroke-width="3.4" stroke-linecap="round"/>`;
    } else if (bothStar) {
      s += `<path d="${d}" fill="none" stroke="#C7A344" stroke-width="3.4" stroke-linecap="round"/>`;
      s += `<path d="${d}" fill="none" stroke="#B4392E" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>`;
    } else {
      const dim = (filter !== "all" && n._branch && n._branch !== filter);
      s += `<path d="${d}" fill="none" stroke="#C7A344" stroke-width="1.4" stroke-linecap="round" opacity="${dim ? 0.14 : 0.5}"/>`;
    }
  });
  svg.innerHTML = s;
}

function updateClasses() {
  visible.forEach(n => {
    const el = nodeEls[n.id]; if (!el) return;
    el.classList.toggle("selected", selected === n.id);
    el.classList.toggle("active", chain.has(n.id));
    el.classList.toggle("match", matches.has(n.id));
    const dim = (filter !== "all" && n._branch && n._branch !== filter);
    el.classList.toggle("dim", dim);
  });
}

function rebuild() { layout(); buildNodes(); buildGens(); drawLinks(); updateClasses(); applyCam(); }
function refresh() { drawLinks(); updateClasses(); }

/* ── Камера ──────────────────────────────────────────────── */
function applyCam() {
  const { s, tx, ty } = cam;
  el_world.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
  if (genEls) { const op = s < 0.32 ? 0 : Math.min(1, (s - 0.32) / 0.3); genEls.forEach(e => e.style.opacity = op); }
}
function vp() { return el_viewport.getBoundingClientRect(); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function home() {
  const r = vp();
  const stars = visible.filter(n => n.star);
  const yT = Math.min(...stars.map(n => n._y));
  const yB = Math.max(...stars.map(n => n._y + n._h));
  const cx = spineCenterX;
  const s = clamp((r.height - 190) / (yB - yT), 0.2, 1.05);
  cam.s = s;
  cam.tx = r.width * 0.34 - cx * s;
  cam.ty = 118 - yT * s;
  applyCam();
}
function fit() {
  const r = vp(); const b = bbox;
  const s = clamp(Math.min((r.width - 90) / (b.maxX - b.minX), (r.height - 180) / (b.maxY - b.minY)), 0.12, 1.1);
  cam.s = s;
  cam.tx = (r.width - (b.maxX + b.minX) * s) / 2;
  cam.ty = Math.max(96, (r.height - (b.maxY + b.minY) * s) / 2);
  applyCam();
}
function zoomAt(f, px, py) {
  const r = vp(); px = px ?? r.width / 2; py = py ?? r.height / 2;
  const ns = clamp(cam.s * f, 0.12, 3);
  const wx = (px - r.left - cam.tx) / cam.s, wy = (py - r.top - cam.ty) / cam.s;
  cam.s = ns; cam.tx = px - r.left - wx * ns; cam.ty = py - r.top - wy * ns; applyCam();
}
function centerOn(n, zoom) {
  const r = vp(); const s = zoom || Math.max(cam.s, 0.75);
  cam.s = s; cam.tx = r.width / 2 - n._cx * s; cam.ty = r.height * 0.42 - n._y * s; applyCam();
}

/* ── Ата-тек чынжыры ─────────────────────────────────────── */
function ancestry(n) { const a = []; let p = n; while (p) { a.unshift(p); p = p.parent ? byId[p.parent] : null; } return a; }
function setChain(n) { chain = new Set(ancestry(n).map(x => x.id)); }

function syncAncLabel() {
  const label = el_anc.querySelector("[data-anclabel]");
  label.textContent = ancExpanded ? "Ата-бабаларды жашыруу" : `Ата-бабаларды ачуу (${segmentIds.length})`;
}

function revealTo(n) { // expand every ancestor + ancestor chain if needed
  const a = ancestry(n);
  if (a.some(x => segmentIdSet.has(x.id))) ancExpanded = true;
  a.forEach(x => { if (childMap[x.id].length) expanded.add(x.id); });
  syncAncLabel();
}

function toggleNode(id) {
  if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
  rebuild();
  if (selected === id && byId[id]) openPanel(byId[id]);
}
function toggleAnc() {
  ancExpanded = !ancExpanded;
  syncAncLabel();
  rebuild();
}
function setFilter(b) {
  filter = b;
  el_chips.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.branch === b));
  refresh();
}
function search(q) {
  q = q.trim().toLowerCase();
  if (!q) { matches = new Set(); el_count.classList.remove("on"); refresh(); return; }
  const hits = nodes.filter(n => n.name.toLowerCase().includes(q));
  matches = new Set(hits.map(n => n.id));
  el_count.textContent = hits.length; el_count.classList.add("on");
  if (hits.length) { revealTo(hits[0]); rebuild(); centerOn(hits[0], Math.max(cam.s, 0.9)); }
  else refresh();
}

/* ── Панель ──────────────────────────────────────────────── */
function openPanel(n) {
  selected = n.id; setChain(n); updateClasses(); refresh();
  const gen = n.gen;
  const kindTag = n.kind === "tribe" ? '<span class="ptag">' + ico("tribe") + "Уруунун аты</span>"
    : n.kind === "leader" ? '<span class="ptag">' + ico("leader") + "Уруу башчысы / атактуу инсан</span>" : "";
  const desc = n.desc ? '<p class="pdesc">' + n.desc + "</p>" : "";
  const collapsed = childMap[n.id].length > 0 && !expanded.has(n.id) && n.id !== ROOT_ID;
  const expandBtn = collapsed ? '<button class="pexpand" data-expand="' + n.id + '"><span>＋</span> Бутакты ачуу (' + n._sub + ")</button>" : "";
  let sibs = "";
  if (n.parent) {
    const list = childMap[n.parent].filter(x => x.id !== n.id);
    if (list.length) sibs = '<div class="psec"><h4>Бир туугандары</h4><ul class="slist">' +
      list.map(x => '<li><a data-jump="' + x.id + '">' + x.name + "</a></li>").join("") + "</ul></div>";
  }
  const anc = ancestry(n);
  const ancHtml = '<div class="psec"><h4>Ата-теги</h4><ul class="anc">' +
    anc.map((x, i) => '<li class="' + (x.id === n.id ? "cur" : "") + '"><span class="g">' + (i === 0 ? "•" : "↳") + '</span><a data-jump="' + x.id + '">' + x.name + "</a></li>").join("") + "</ul></div>";
  const stats = '<div class="psec"><h4>Сандар</h4><div class="stats">' +
    '<div class="stat"><div class="n">' + n._kids + '</div><div class="l">уул тукуму</div></div>' +
    '<div class="stat"><div class="n">' + n._sub + '</div><div class="l">бардык урпагы</div></div></div></div>';
  el_pbody.innerHTML =
    '<div class="eyebrow">' + gen + "-муун</div>" +
    '<h2 class="pname">' + n.name + "</h2>" + kindTag + desc + expandBtn + sibs + ancHtml + stats;
  el_panel.classList.add("on");
  if (window.matchMedia("(max-width:760px)").matches) el_scrim.classList.add("on");
  el_pbody.scrollTop = 0;
}
function closePanel() {
  el_panel.classList.remove("on"); el_scrim.classList.remove("on");
  selected = null; chain = new Set(); updateClasses(); refresh();
}
function jump(id) { const n = byId[id]; revealTo(n); rebuild(); openPanel(n); centerOn(n, Math.max(cam.s, 0.85)); }

/* ── Окуялар ─────────────────────────────────────────────── */
function wire() {
  el_header.addEventListener("click", e => {
    const b = e.target.closest("[data-branch]"); if (b) { setFilter(b.dataset.branch); return; }
    const a = e.target.closest("[data-action]"); if (!a) return;
    const act = a.dataset.action;
    if (act === "zin") zoomAt(1.3); else if (act === "zout") zoomAt(1 / 1.3);
    else if (act === "home") home(); else if (act === "fit") fit(); else if (act === "anc") toggleAnc();
  });
  el_search.addEventListener("input", e => search(e.target.value));

  let dragging = false;
  el_nodes.addEventListener("mouseover", e => { const nd = e.target.closest(".node"); if (nd && !dragging) { setChain(byId[nd.dataset.id]); refresh(); } });
  el_nodes.addEventListener("mouseout", e => { const nd = e.target.closest(".node"); if (nd && !selected) { chain = new Set(); refresh(); } });

  el_panel.addEventListener("click", e => {
    if (e.target.closest('[data-action="close"]')) return closePanel();
    const j = e.target.closest("[data-jump]"); if (j) return jump(j.dataset.jump);
    const ex = e.target.closest("[data-expand]"); if (ex) { expanded.add(ex.dataset.expand); rebuild(); openPanel(byId[ex.dataset.expand]); }
  });
  el_scrim.addEventListener("click", () => closePanel());

  // Panning captures the pointer on the whole canvas for reliable drag-tracking, which
  // retargets the browser's native click away from any node/toggle/knot underneath —
  // so taps are resolved geometrically at pointerup instead of via a click listener.
  const viewport = el_viewport; const pts = new Map(); let last = null, pd0 = 0, ps0 = 1;
  viewport.addEventListener("pointerdown", e => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); viewport.setPointerCapture(e.pointerId);
    if (pts.size === 1) { last = { x: e.clientX, y: e.clientY }; dragging = false; viewport.classList.add("grabbing"); }
    else if (pts.size === 2) { const p = [...pts.values()]; pd0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); ps0 = cam.s; }
  });
  viewport.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const p = [...pts.values()]; const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const cx = (p[0].x + p[1].x) / 2, cy = (p[0].y + p[1].y) / 2; const f = (ps0 * d / pd0) / cam.s; zoomAt(f, cx, cy); return; }
    if (last) { const dx = e.clientX - last.x, dy = e.clientY - last.y; if (Math.abs(dx) + Math.abs(dy) > 3) dragging = true;
      cam.tx += dx; cam.ty += dy; last = { x: e.clientX, y: e.clientY }; applyCam(); }
  });
  const up = e => {
    pts.delete(e.pointerId); if (pts.size < 2) pd0 = 0;
    if (pts.size === 0) {
      last = null; viewport.classList.remove("grabbing");
      if (!dragging) {
        const t = document.elementFromPoint(e.clientX, e.clientY);
        const tgl = t && t.closest ? t.closest(".tgl") : null;
        const knot = t && t.closest ? t.closest(".knot") : null;
        const nd = t && t.closest ? t.closest(".node") : null;
        if (tgl) toggleNode(tgl.dataset.tgl);
        else if (knot) toggleAnc();
        else if (nd) openPanel(byId[nd.dataset.id]);
      }
      setTimeout(() => dragging = false, 30);
    }
  };
  viewport.addEventListener("pointerup", up); viewport.addEventListener("pointercancel", up);
  viewport.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
}

/* ── Ишке киргизүү ───────────────────────────────────────── */
function init() {
  buildData();
  expanded = new Set(nodes.filter(n => n.star).map(n => n.id));
  ancExpanded = false;
  filter = "all";
  selected = null;
  matches = new Set();
  chain = new Set();
  cam = { s: 1, tx: 0, ty: 0 };
  captureEls();
  syncAncLabel();
  wire();
  const go = () => { rebuild(); home(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  window.addEventListener("resize", () => applyCam());
}
init();
