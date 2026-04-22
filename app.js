
(() => {
  const REWARD_VALUES = { E: 4, A: 3, O: 2, I: 1, U: 0, X: -1 };
  const REWARD_MEANINGS = {
    E: 'Especially important',
    A: 'Important',
    O: 'Ordinary importance',
    I: 'Low priority',
    U: 'Unimportant',
    X: 'Undesirable',
  };
  const COLOR_PALETTE = [
    '#2DD4BF', '#4ADE80', '#22C55E', '#94A3B8', '#60A5FA', '#FB923C', '#FBBF24',
    '#A3E635', '#FCD34D', '#38BDF8', '#C084FC', '#9CA3AF', '#F472B6', '#F97316',
    '#34D399', '#818CF8', '#FB7185', '#67E8F9', '#F59E0B', '#A78BFA', '#14B8A6',
  ];
  const ITER_NAMES = [
    '1 — Current State',
    '2 — Safety & Noise Fix',
    '3 — Flow Optimization',
    '4 — Sylva Expansion',
    '5 — Final + MH System',
  ];
  const DEFAULT_DEPTS = [
    { id: 1, name: 'Receiving', abbr: 'RCV', color: '#2DD4BF', sqft: 4000, locked: false, capped: false, grow: false, shrink: false },
    { id: 2, name: 'Raw Materials 1', abbr: 'RM1', color: '#4ADE80', sqft: 3200, locked: false, capped: false, grow: false, shrink: false },
    { id: 3, name: 'Raw Materials 2', abbr: 'RM2', color: '#22C55E', sqft: 5200, locked: false, capped: false, grow: false, shrink: false },
    { id: 4, name: 'Machining 1', abbr: 'MC1', color: '#94A3B8', sqft: 6000, locked: false, capped: false, grow: false, shrink: false },
    { id: 5, name: 'Machining 2', abbr: 'MC2', color: '#60A5FA', sqft: 6000, locked: false, capped: false, grow: false, shrink: false },
    { id: 6, name: 'Die Casting', abbr: 'DC', color: '#FB923C', sqft: 5000, locked: false, capped: false, grow: false, shrink: false },
    { id: 7, name: 'Assembly & Finishing', abbr: 'AF', color: '#FBBF24', sqft: 14000, locked: false, capped: false, grow: false, shrink: false },
    { id: 8, name: 'Testing', abbr: 'TST', color: '#A3E635', sqft: 7900, locked: false, capped: false, grow: false, shrink: false },
    { id: 9, name: 'Finished Goods', abbr: 'FG', color: '#FCD34D', sqft: 8700, locked: false, capped: false, grow: false, shrink: false },
    { id: 10, name: 'Shipping', abbr: 'SHP', color: '#38BDF8', sqft: 4000, locked: false, capped: false, grow: false, shrink: false },
    { id: 11, name: 'Maintenance', abbr: 'MNT', color: '#C084FC', sqft: 2400, locked: false, capped: false, grow: false, shrink: false },
    { id: 12, name: 'Offices', abbr: 'OFF', color: '#9CA3AF', sqft: 6800, locked: false, capped: false, grow: false, shrink: false },
    { id: 13, name: 'Restrooms/Break Rm', abbr: 'RST', color: '#F472B6', sqft: 3000, locked: false, capped: false, grow: false, shrink: false },
  ];
  const DEFAULT_FLOW_PAIRS = [
    { a: 1, b: 2, flow: 7 }, { a: 1, b: 10, flow: 8 }, { a: 2, b: 4, flow: 120 },
    { a: 3, b: 5, flow: 90 }, { a: 3, b: 6, flow: 45 }, { a: 4, b: 7, flow: 80 },
    { a: 5, b: 7, flow: 90 }, { a: 6, b: 5, flow: 45 }, { a: 7, b: 8, flow: 10 },
    { a: 7, b: 9, flow: 160 }, { a: 8, b: 9, flow: 10 }, { a: 9, b: 10, flow: 34 },
  ];
  const DEFAULT_REWARD_PAIRS = [
    { a: 1, b: 2, r: 'E' }, { a: 1, b: 10, r: 'E' }, { a: 2, b: 4, r: 'E' },
    { a: 3, b: 5, r: 'E' }, { a: 3, b: 6, r: 'I' }, { a: 4, b: 7, r: 'A' },
    { a: 5, b: 7, r: 'A' }, { a: 6, b: 5, r: 'I' }, { a: 7, b: 8, r: 'O' },
    { a: 7, b: 9, r: 'A' }, { a: 8, b: 9, r: 'O' }, { a: 9, b: 10, r: 'E' },
    { a: 11, b: 4, r: 'I' }, { a: 11, b: 5, r: 'I' }, { a: 11, b: 6, r: 'I' },
    { a: 12, b: 5, r: 'X' }, { a: 12, b: 6, r: 'X' }, { a: 12, b: 4, r: 'X' },
    { a: 13, b: 4, r: 'X' }, { a: 13, b: 5, r: 'X' }, { a: 13, b: 12, r: 'A' },
  ];
  const ALGO_META = {
    craft:   { label: 'CRAFT — Pairwise Exchange', needs: ['flow'], obj: 'dscore', desc: 'Tries pairwise department swaps and accepts improvements.' },
    random:  { label: 'Random Multi-Start + CRAFT', needs: ['flow'], obj: 'dscore', desc: 'Explores random starts and keeps the best refined solution.' },
    slp:     { label: 'SLP — Systematic Layout Planning', needs: ['flow'], obj: 'dscore', desc: 'Ranks departments by combined influence before refinement.' },
    corelap: { label: 'CORELAP — TCR Placement', needs: ['adj'], obj: 'ascore', desc: 'Optimizes closeness ratings first.' },
    aldep:   { label: 'ALDEP — Adjacency Layout', needs: ['adj'], obj: 'ascore', desc: 'Multiple greedy adjacency starts, best A-score wins.' },
    blocplan:{ label: 'BLOCPLAN — Block Planner', needs: ['adj'], obj: 'ascore', desc: 'Greedy adjacency order refined by pairwise exchange.' },
    hybrid:  { label: 'Hybrid REL + D-Score', needs: ['flow', 'adj'], obj: 'hybrid', desc: 'Balances flow distance and adjacency in one objective.' },
  };

  const qs = (sel) => document.querySelector(sel);
  const el = {
    leftSidebar: qs('#leftSidebar'),
    rightSidebar: qs('#rightSidebar'),
    overlay: qs('#overlay'),
    deptList: qs('#deptList'),
    gridBoard: qs('#gridBoard'),
    metricCards: qs('#metricCards'),
    flowContribTable: qs('#flowContribTable'),
    adjacencyTable: qs('#adjacencyTable'),
    buildSummary: qs('#buildSummary'),
    activeDeptSelect: qs('#activeDeptSelect'),
    toolSelect: qs('#toolSelect'),
    rectX1: qs('#rectX1'), rectY1: qs('#rectY1'), rectX2: qs('#rectX2'), rectY2: qs('#rectY2'),
    notesInput: qs('#notesInput'),
    iterationSlots: qs('#iterationSlots'),
    workbookInput: qs('#workbookInput'),
    uiScaleRange: qs('#uiScaleRange'),
    uiScaleValue: qs('#uiScaleValue'),
    tabOverview: qs('#tab-overview'), tabAlgorithm: qs('#tab-algorithm'), tabData: qs('#tab-data'), tabIterations: qs('#tab-iterations'), tabLog: qs('#tab-log'),
  };

  const state = {
    gw: 35,
    gh: 25,
    ft: 10,
    cells: [],
    depts: clone(DEFAULT_DEPTS),
    flowPairs: clone(DEFAULT_FLOW_PAIRS),
    rewardPairs: clone(DEFAULT_REWARD_PAIRS),
    lockedIds: [],
    upperBound: true,
    activeDept: 2,
    tool: 'rect',
    algo: 'craft',
    nc: 4,
    maxIt: 30,
    trials: 5,
    impIt: 20,
    iterNotes: '',
    iterations: defaultIterations(),
    log: ['Ready. Paint a layout or run an algorithm.'],
    previewRect: null,
    mouseDrag: null,
    openSidebar: null,
    lastScores: null,
    dataSource: 'Built-in defaults',
    uiScale: 100,
  };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function defaultIterations() {
    return ITER_NAMES.map((name) => ({ saved: false, name, notes: '', cells: null, ds: null, as: null, eMet: null, eTotal: null, xVio: null, algo: '', ts: '' }));
  }
  function initCells(gw, gh) { return new Array(gw * gh).fill(0); }
  function cellArea(ft) { return ft * ft; }
  function targetCells(sqft, ft) { return Math.max(1, Math.round(sqft / cellArea(ft))); }
  function normalizeAbbr(name, abbr, id) {
    const base = String(abbr || name || `D${id}`).toUpperCase().replace(/\s+/g, '').replace(/&/g, '');
    return (base || `D${id}`).slice(0, 4);
  }
  function nextDeptId() { return Math.max(0, ...state.depts.map((d) => d.id)) + 1; }
  function nextColor(i) { return COLOR_PALETTE[i % COLOR_PALETTE.length]; }
  function dm() {
    const out = new Map();
    state.depts.forEach((d) => out.set(d.id, d));
    return out;
  }
  function clamp(val, lo, hi) { return Math.max(lo, Math.min(hi, Number(val))); }
  function sanitizeState() {
    const valid = new Set(state.depts.map((d) => d.id));
    if (state.cells.length !== state.gw * state.gh) state.cells = initCells(state.gw, state.gh);
    state.cells = state.cells.map((c) => (valid.has(c) ? c : 0));
    state.lockedIds = state.depts.filter((d) => d.locked).map((d) => d.id);
    if (!valid.has(state.activeDept) && state.depts.length) state.activeDept = state.depts[0].id;
    state.nc = clamp(state.nc, 1, state.gw);
    state.maxIt = clamp(state.maxIt, 1, 200);
    state.trials = clamp(state.trials, 1, 100);
    state.impIt = clamp(state.impIt, 1, 200);
    state.uiScale = clamp(Number(state.uiScale || 100), 75, 135);
    state.rect = {
      x1: clamp(Number(el.rectX1.value || 0), 0, state.gw - 1),
      y1: clamp(Number(el.rectY1.value || 0), 0, state.gh - 1),
      x2: clamp(Number(el.rectX2.value || Math.min(4, state.gw - 1)), 0, state.gw - 1),
      y2: clamp(Number(el.rectY2.value || Math.min(4, state.gh - 1)), 0, state.gh - 1),
    };
  }
  function lockSet() { return new Set(state.lockedIds); }
  function applyUiScale() {
    const scale = clamp(Number(state.uiScale || 100), 75, 135);
    state.uiScale = scale;
    document.documentElement.style.setProperty('--ui-scale', (scale / 100).toFixed(2));
    if (el.uiScaleRange) el.uiScaleRange.value = String(scale);
    if (el.uiScaleValue) el.uiScaleValue.textContent = `${scale}%`;
  }
  function countCells(cells) {
    const out = {};
    for (const id of cells) if (id) out[id] = (out[id] || 0) + 1;
    return out;
  }
  function getLockedData(cells, lockedIds, gw, gh, ft) {
    const lockedSet = new Set(lockedIds);
    const cellOwner = new Array(cells.length).fill(0);
    const byDept = [];
    for (const did of lockedIds) {
      const indices = [];
      cells.forEach((c, i) => {
        if (c === did) {
          cellOwner[i] = did;
          indices.push(i);
        }
      });
      if (indices.length) byDept.push({ id: did, indices, sqft: indices.length * cellArea(ft) });
    }
    return {
      ids: [...lockedIds],
      idSet: lockedSet,
      cellOwner,
      byDept,
      lockedCount: cellOwner.filter(Boolean).length,
    };
  }
  function scoreCells(cells, gw, gh, ft, depts, flowPairs, rewardPairs) {
    const deptMap = dm();
    const cx = {}, cy = {}, cc = {};
    cells.forEach((did, idx) => {
      if (!did || !deptMap.has(did)) return;
      const x = idx % gw;
      const y = Math.floor(idx / gw);
      cx[did] = (cx[did] || 0) + x + 0.5;
      cy[did] = (cy[did] || 0) + y + 0.5;
      cc[did] = (cc[did] || 0) + 1;
    });

    let ds = 0;
    const dpairs = [];
    (flowPairs || []).forEach((p) => {
      const a = p.a, b = p.b, fl = Number(p.flow || 0);
      if (!fl || !cc[a] || !cc[b]) return;
      const dx = (cx[a] / cc[a] - cx[b] / cc[b]) * ft;
      const dy = (cy[a] / cc[a] - cy[b] / cc[b]) * ft;
      const d = Math.sqrt(dx * dx + dy * dy);
      ds += fl * d;
      dpairs.push({ from: a, to: b, flow: fl, dist: Math.round(d), contrib: Math.round(fl * d) });
    });

    const adjSet = new Set();
    cells.forEach((did, idx) => {
      if (!did || !deptMap.has(did)) return;
      const x = idx % gw, y = Math.floor(idx / gw);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) return;
        const nid = cells[ny * gw + nx];
        if (nid && nid !== did && deptMap.has(nid)) adjSet.add(`${Math.min(did, nid)}|${Math.max(did, nid)}`);
      });
    });

    let as = 0;
    const adetails = [];
    (rewardPairs || []).forEach((p) => {
      const a = p.a, b = p.b, r = (p.r || 'I').toUpperCase();
      const vb = REWARD_VALUES[r] ?? Number(p.value || 0);
      const adj = adjSet.has(`${Math.min(a, b)}|${Math.max(a, b)}`);
      const val = adj ? vb : 0;
      as += val;
      adetails.push({ a, b, r, meaning: REWARD_MEANINGS[r] || r, adj, val });
    });

    const dsqft = {};
    cells.forEach((c) => { if (c) dsqft[c] = (dsqft[c] || 0) + cellArea(ft); });
    return { ds: Math.round(ds), as, dpairs, adetails, adjSet, dsqft };
  }
  function metricObj(obj, ds, as, fp, rp) {
    if (obj === 'dscore') return Number(ds);
    if (obj === 'ascore') return -Number(as);
    const fs = Math.max(1, (fp || []).reduce((acc, p) => acc + Number(p.flow || 0), 0) * 10);
    const rs = Math.max(1, (rp || []).reduce((acc, p) => acc + Math.abs(REWARD_VALUES[(p.r || 'I').toUpperCase()] || 0), 0));
    return ds / fs - as / rs;
  }
  function computeDesired(ids, depts, gw, gh, ft, lockedData, upperBound = true) {
    const deptMap = dm();
    const locked = lockedData.idSet;
    const avail = gw * gh - lockedData.lockedCount;
    const free = ids.filter((i) => deptMap.has(i) && !locked.has(i));
    const counts = {};
    free.forEach((i) => { counts[i] = targetCells(deptMap.get(i).sqft, ft); });
    let total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total > avail) {
      let need = total - avail;
      const cut = (list) => {
        let changed = true;
        while (need > 0 && changed) {
          changed = false;
          for (const i of list) {
            if (need <= 0) break;
            if ((counts[i] || 0) > 1) {
              counts[i] -= 1;
              need -= 1;
              changed = true;
            }
          }
        }
      };
      cut(free.filter((i) => deptMap.get(i).shrink));
      if (need > 0) cut(free);
    }
    total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total < avail) {
      let extra = avail - total;
      const growers = free.filter((i) => {
        const d = deptMap.get(i);
        return d.grow && (!upperBound || !d.capped);
      });
      if (growers.length) {
        let k = 0;
        while (extra > 0) {
          const id = growers[k % growers.length];
          counts[id] = (counts[id] || 0) + 1;
          extra -= 1;
          k += 1;
        }
      }
    }
    return counts;
  }
  function buildLayoutCells(ids, nc, gw, gh, ft, depts, lockedData, upperBound = true) {
    const deptMap = dm();
    const cells = initCells(gw, gh);
    const co = lockedData.cellOwner || new Array(gw * gh).fill(0);
    (lockedData.byDept || []).forEach((dep) => dep.indices.forEach((i) => { if (i < cells.length) cells[i] = dep.id; }));
    const locked = lockedData.idSet;
    const free = ids.filter((i) => deptMap.has(i) && !locked.has(i));
    if (!free.length) return cells;
    const desired = computeDesired(ids, depts, gw, gh, ft, lockedData, upperBound);
    const cols = Math.max(1, Math.min(nc, gw));
    const colLists = [];
    for (let c = 0; c < cols; c += 1) {
      const x0 = Math.floor((gw * c) / cols);
      const x1 = Math.floor((gw * (c + 1)) / cols);
      const cl = [];
      for (let y = 0; y < gh; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const idx = y * gw + x;
          if (!co[idx]) cl.push(idx);
        }
      }
      colLists.push(cl);
    }
    const buckets = Array.from({ length: cols }, () => []);
    free.forEach((id, i) => buckets[i % cols].push(id));
    const pos = new Array(cols).fill(0);
    for (let c = 0; c < cols; c += 1) {
      let sp = c;
      for (const id of buckets[c]) {
        let need = desired[id] || 0;
        while (need > 0 && sp < cols) {
          while (need > 0 && pos[sp] < colLists[sp].length) {
            cells[colLists[sp][pos[sp]]] = id;
            pos[sp] += 1;
            need -= 1;
          }
          if (need > 0) sp += 1;
        }
      }
    }
    return cells;
  }
  function evalIds(ids, nc, obj, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    const cells = buildLayoutCells(ids, nc, gw, gh, ft, depts, ld, ub);
    const s = scoreCells(cells, gw, gh, ft, depts, fp, rp);
    return { objVal: metricObj(obj, s.ds, s.as, fp, rp), ds: s.ds, as: s.as };
  }
  function runCraft(ids0, nc, maxIt, obj, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    let ids = [...ids0];
    let ev = evalIds(ids, nc, obj, gw, gh, ft, depts, fp, rp, ld, ub);
    const hist = [{ iter: 0, ds: ev.ds, as: ev.as }];
    const ls = ld.idSet || new Set();
    const fi = ids.flatMap((v, i) => (ls.has(v) ? [] : [i]));
    let improved = true;
    let itr = 0;
    while (improved && itr < maxIt) {
      improved = false;
      let found = false;
      for (let i = 0; i < fi.length && !found; i += 1) {
        for (let j = i + 1; j < fi.length; j += 1) {
          const ni = [...ids];
          [ni[fi[i]], ni[fi[j]]] = [ni[fi[j]], ni[fi[i]]];
          const ne = evalIds(ni, nc, obj, gw, gh, ft, depts, fp, rp, ld, ub);
          if (ne.objVal < ev.objVal - 1e-9) {
            ids = ni;
            ev = ne;
            improved = true;
            hist.push({ iter: itr + 1, ds: ev.ds, as: ev.as });
            found = true;
            break;
          }
        }
      }
      itr += 1;
    }
    return { ids, iter: itr, hist, ds: ev.ds, as: ev.as };
  }
  function adjTotals(depts, rp) {
    const t = {};
    depts.forEach((d) => { t[d.id] = 0; });
    (rp || []).forEach((p) => {
      const v = REWARD_VALUES[(p.r || 'I').toUpperCase()] || 0;
      if (t[p.a] != null) t[p.a] += v;
      if (t[p.b] != null) t[p.b] += v;
    });
    return t;
  }
  function rel(a, b, rp) {
    for (const p of (rp || [])) {
      if ((p.a === a && p.b === b) || (p.a === b && p.b === a)) return REWARD_VALUES[(p.r || 'I').toUpperCase()] || 0;
    }
    return 0;
  }
  function greedyOrder(depts, rp, ld, rand = false) {
    const ls = ld.idSet || new Set();
    const lids = ld.ids || [];
    const free = depts.filter((d) => !ls.has(d.id));
    if (!free.length) return [...lids];
    const t = adjTotals(depts, rp);
    let rem = [...free].sort((a, b) => (t[b.id] || 0) - (t[a.id] || 0)).map((d) => d.id);
    let seed = rem.shift();
    if (rand && rem.length) {
      const pool = [seed, ...rem.slice(0, Math.min(2, rem.length))];
      seed = pool[Math.floor(Math.random() * pool.length)];
      rem = free.map((d) => d.id).filter((id) => id !== seed);
    }
    const order = [seed];
    while (rem.length) {
      rem.sort((a, b) => {
        const sa = order.reduce((acc, p) => acc + rel(a, p, rp), 0) + (rand ? Math.random() * 0.25 : 0);
        const sb = order.reduce((acc, p) => acc + rel(b, p, rp), 0) + (rand ? Math.random() * 0.25 : 0);
        return sb - sa;
      });
      order.push(rem.shift());
    }
    return [...lids, ...order];
  }
  function runCorelap(nc, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    const ids = greedyOrder(depts, rp, ld, false);
    const r = runCraft(ids, nc, 12, 'ascore', gw, gh, ft, depts, fp, rp, ld, ub);
    return { ...r, iter: Math.max(1, r.iter) };
  }
  function runAldep(nc, trials, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    let best = null;
    for (let i = 0; i < trials; i += 1) {
      const ids = greedyOrder(depts, rp, ld, true);
      const r = runCraft(ids, nc, 10, 'ascore', gw, gh, ft, depts, fp, rp, ld, ub);
      if (!best || r.as > best.as || (r.as === best.as && r.ds < best.ds)) best = r;
    }
    return best;
  }
  function runBlocplan(nc, maxIt, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    const ids = greedyOrder(depts, rp, ld, false);
    const r = runCraft(ids, nc, maxIt, 'ascore', gw, gh, ft, depts, fp, rp, ld, ub);
    return { ...r, iter: Math.max(1, r.iter) };
  }
  function runRandom(nc, trials, impIt, obj, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    const lids = ld.ids || [];
    const ls = ld.idSet || new Set();
    const free = depts.filter((d) => !ls.has(d.id)).map((d) => d.id);
    let best = null;
    for (let i = 0; i < trials; i += 1) {
      const ids = [...lids, ...shuffle([...free])];
      const r = runCraft(ids, nc, impIt, obj, gw, gh, ft, depts, fp, rp, ld, ub);
      if (!best || metricObj(obj, r.ds, r.as, fp, rp) < metricObj(obj, best.ds, best.as, fp, rp)) best = r;
    }
    return best;
  }
  function runSlp(nc, maxIt, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    const lids = ld.ids || [];
    const ls = ld.idSet || new Set();
    const c = {};
    depts.forEach((d) => { c[d.id] = 0; });
    (rp || []).forEach((p) => {
      const v = (REWARD_VALUES[(p.r || 'I').toUpperCase()] || 0) * 10;
      if (c[p.a] != null) c[p.a] += v;
      if (c[p.b] != null) c[p.b] += v;
    });
    (fp || []).forEach((p) => {
      if (c[p.a] != null) c[p.a] += Number(p.flow || 0);
      if (c[p.b] != null) c[p.b] += Number(p.flow || 0);
    });
    const free = depts.filter((d) => !ls.has(d.id)).map((d) => d.id).sort((a, b) => c[b] - c[a]);
    return runCraft([...lids, ...free], nc, maxIt, 'dscore', gw, gh, ft, depts, fp, rp, ld, ub);
  }
  function runHybrid(nc, maxIt, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    const lids = ld.ids || [];
    const ls = ld.idSet || new Set();
    const c = {};
    depts.forEach((d) => { c[d.id] = 0; });
    (rp || []).forEach((p) => {
      const v = (REWARD_VALUES[(p.r || 'I').toUpperCase()] || 0) * 10;
      if (c[p.a] != null) c[p.a] += v;
      if (c[p.b] != null) c[p.b] += v;
    });
    (fp || []).forEach((p) => {
      if (c[p.a] != null) c[p.a] += Number(p.flow || 0);
      if (c[p.b] != null) c[p.b] += Number(p.flow || 0);
    });
    const free = depts.filter((d) => !ls.has(d.id)).map((d) => d.id).sort((a, b) => c[b] - c[a]);
    return runCraft([...lids, ...free], nc, maxIt, 'hybrid', gw, gh, ft, depts, fp, rp, ld, ub);
  }
  function dispatchAlgo(algo, nc, maxIt, trials, impIt, gw, gh, ft, depts, fp, rp, ld, ub = true) {
    if (algo === 'craft') return runCraft(depts.map((d) => d.id), nc, maxIt, 'dscore', gw, gh, ft, depts, fp, rp, ld, ub);
    if (algo === 'random') return runRandom(nc, trials, impIt, 'dscore', gw, gh, ft, depts, fp, rp, ld, ub);
    if (algo === 'slp') return runSlp(nc, maxIt, gw, gh, ft, depts, fp, rp, ld, ub);
    if (algo === 'corelap') return runCorelap(nc, gw, gh, ft, depts, fp, rp, ld, ub);
    if (algo === 'aldep') return runAldep(nc, trials, gw, gh, ft, depts, fp, rp, ld, ub);
    if (algo === 'blocplan') return runBlocplan(nc, maxIt, gw, gh, ft, depts, fp, rp, ld, ub);
    if (algo === 'hybrid') return runHybrid(nc, maxIt, gw, gh, ft, depts, fp, rp, ld, ub);
    return runCraft(depts.map((d) => d.id), nc, maxIt, 'dscore', gw, gh, ft, depts, fp, rp, ld, ub);
  }
  function validateAlgo(algo, fp, rp) {
    const meta = ALGO_META[algo] || { needs: [] };
    if (meta.needs.includes('flow') && !(fp || []).length) return [false, 'This algorithm requires flow / D-score data.'];
    if (meta.needs.includes('adj') && !(rp || []).length) return [false, 'This algorithm requires adjacency / REL data.'];
    return [true, ''];
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function log(message) {
    state.log = [...state.log, `[${new Date().toLocaleTimeString()}] ${message}`].slice(-60);
  }
  function paintedSqftFor(id) {
    return (countCells(state.cells)[id] || 0) * cellArea(state.ft);
  }
  function fmtInt(v) { return Number(v || 0).toLocaleString(); }

  function openSidebar(which) {
    state.openSidebar = which;
    el.leftSidebar.classList.toggle('open', which === 'left');
    el.rightSidebar.classList.toggle('open', which === 'right');
    el.overlay.classList.toggle('hidden', !which);
  }
  function bindPanels() {
    qs('#openLeftBtn').addEventListener('click', () => openSidebar('left'));
    qs('#openRightBtn').addEventListener('click', () => openSidebar('right'));
    qs('#closeLeftBtn').addEventListener('click', () => openSidebar(null));
    qs('#closeRightBtn').addEventListener('click', () => openSidebar(null));
    el.overlay.addEventListener('click', () => openSidebar(null));
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
        qs(`#tab-${btn.dataset.tab}`).classList.add('active');
      });
    });
  }

  function applyRect(x1, y1, x2, y2, fillId) {
    const xs = [x1, x2].sort((a, b) => a - b);
    const ys = [y1, y2].sort((a, b) => a - b);
    const locked = lockSet();
    for (let y = ys[0]; y <= ys[1]; y += 1) {
      for (let x = xs[0]; x <= xs[1]; x += 1) {
        const idx = y * state.gw + x;
        const current = state.cells[idx];
        if (current && locked.has(current)) continue;
        if (fillId && locked.has(fillId) && current && current !== fillId && locked.has(current)) continue;
        state.cells[idx] = fillId;
      }
    }
    log(`${fillId ? 'Painted' : 'Erased'} rectangle (${xs[0]},${ys[0]}) → (${xs[1]},${ys[1]}).`);
    persistState();
    refresh();
  }

  function renderGrid() {
    el.gridBoard.innerHTML = '';
    el.gridBoard.style.gridTemplateColumns = `repeat(${state.gw}, var(--cell-size))`;
    const locked = lockSet();
    const previewSet = new Set();
    if (state.previewRect) {
      const { x1, y1, x2, y2 } = state.previewRect;
      const xs = [x1, x2].sort((a, b) => a - b);
      const ys = [y1, y2].sort((a, b) => a - b);
      for (let y = ys[0]; y <= ys[1]; y += 1) for (let x = xs[0]; x <= xs[1]; x += 1) previewSet.add(y * state.gw + x);
    }
    state.cells.forEach((did, idx) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'grid-cell';
      if (did) {
        const dept = state.depts.find((d) => d.id === did);
        if (dept) cell.style.background = dept.color;
        cell.title = dept ? `${dept.name} (${dept.abbr})` : `Dept ${did}`;
      } else {
        cell.title = 'Empty';
      }
      if (locked.has(did)) cell.classList.add('locked-cell');
      if (previewSet.has(idx)) cell.classList.add('preview-cell');
      cell.dataset.idx = idx;
      const x = idx % state.gw;
      const y = Math.floor(idx / state.gw);
      cell.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        state.mouseDrag = { x1: x, y1: y, x2: x, y2: y };
        state.previewRect = { ...state.mouseDrag };
        refresh(false);
      });
      cell.addEventListener('mouseenter', () => {
        if (!state.mouseDrag) return;
        state.mouseDrag.x2 = x;
        state.mouseDrag.y2 = y;
        state.previewRect = { ...state.mouseDrag };
        renderGrid();
      });
      cell.addEventListener('mouseup', () => {
        if (!state.mouseDrag) return;
        const rect = state.mouseDrag;
        state.mouseDrag = null;
        state.previewRect = null;
        const fill = state.tool === 'erase' ? 0 : state.activeDept;
        applyRect(rect.x1, rect.y1, rect.x2, rect.y2, fill);
      });
      el.gridBoard.appendChild(cell);
    });
  }
  window.addEventListener('mouseup', () => {
    if (!state.mouseDrag) return;
    const rect = state.mouseDrag;
    state.mouseDrag = null;
    state.previewRect = null;
    const fill = state.tool === 'erase' ? 0 : state.activeDept;
    applyRect(rect.x1, rect.y1, rect.x2, rect.y2, fill);
  });

  function currentScores() {
    state.lastScores = scoreCells(state.cells, state.gw, state.gh, state.ft, state.depts, state.flowPairs, state.rewardPairs);
    return state.lastScores;
  }
  function renderMetrics() {
    const scores = currentScores();
    const eTotal = scores.adetails.filter((a) => a.r === 'E').length;
    const eMet = scores.adetails.filter((a) => a.r === 'E' && a.adj).length;
    const xVio = scores.adetails.filter((a) => a.r === 'X' && a.adj).length;
    const cards = [
      ['D-Score', fmtInt(scores.ds), 'Lower is better'],
      ['A-Score', fmtInt(scores.as), 'Higher is better'],
      ['E-Pairs', `${eMet}/${eTotal}`, 'Must-have adjacencies'],
      ['X-Violations', fmtInt(xVio), 'Zero is ideal'],
      ['Target / Cap', `${fmtInt(totalPaintedSqft())}/${fmtInt(totalTargetSqft())}`, `${state.gw}×${state.gh} grid @ ${state.ft} ft`],
    ];
    el.metricCards.innerHTML = cards.map(([label, value, hint]) => `
      <article class="metric-card">
        <div class="label">${label}</div>
        <div class="value mono">${value}</div>
        <div class="hint">${hint}</div>
      </article>
    `).join('');
    el.buildSummary.innerHTML = `<div>${state.dataSource}</div><div class="mono">${state.gw * state.ft} ft × ${state.gh * state.ft} ft building</div>`;

    const flowRows = [...scores.dpairs].sort((a, b) => b.contrib - a.contrib).slice(0, 8).map((p) => {
      return `<tr><td>${deptLabel(p.from)}</td><td>${deptLabel(p.to)}</td><td class="mono">${fmtInt(p.flow)}</td><td class="mono">${fmtInt(p.dist)}</td><td class="mono">${fmtInt(p.contrib)}</td></tr>`;
    }).join('') || `<tr><td colspan="5" class="empty-state">No flow data available.</td></tr>`;
    el.flowContribTable.innerHTML = `<table class="mini-table"><thead><tr><th>From</th><th>To</th><th>Flow</th><th>Dist</th><th>Impact</th></tr></thead><tbody>${flowRows}</tbody></table>`;

    const adjRows = [...scores.adetails].sort((a, b) => (b.adj === a.adj ? (REWARD_VALUES[b.r] || 0) - (REWARD_VALUES[a.r] || 0) : Number(b.adj) - Number(a.adj))).slice(0, 10).map((a) => {
      const badge = a.adj ? '<span class="badge good">Adjacent</span>' : '<span class="badge bad">Not adjacent</span>';
      return `<tr><td>${deptLabel(a.a)}</td><td>${deptLabel(a.b)}</td><td>${a.r}</td><td>${badge}</td><td class="mono">${fmtInt(a.val)}</td></tr>`;
    }).join('') || `<tr><td colspan="5" class="empty-state">No REL data available.</td></tr>`;
    el.adjacencyTable.innerHTML = `<table class="mini-table"><thead><tr><th>A</th><th>B</th><th>REL</th><th>Status</th><th>Score</th></tr></thead><tbody>${adjRows}</tbody></table>`;
  }
  function deptLabel(id) {
    if (!id) return '';
    const d = state.depts.find((x) => x.id === id);
    return d ? d.abbr : `D${id}`;
  }
  function totalTargetSqft() { return state.depts.reduce((acc, d) => acc + Number(d.sqft || 0), 0); }
  function totalPaintedSqft() { return state.cells.filter(Boolean).length * cellArea(state.ft); }

  function renderDeptSelect() {
    el.activeDeptSelect.innerHTML = state.depts.map((d) => `<option value="${d.id}">${d.name} (${d.abbr})</option>`).join('');
    el.activeDeptSelect.value = String(state.activeDept);
  }

  function renderDeptSidebar() {
    const counts = countCells(state.cells);
    el.deptList.innerHTML = '';
    state.depts.forEach((d, idx) => {
      const card = document.getElementById('deptCardTemplate').content.firstElementChild.cloneNode(true);
      card.classList.toggle('selected', d.id === state.activeDept);
      card.querySelector('.dept-select-btn').textContent = `${d.name} (${d.abbr})`;
      card.querySelector('.dept-select-btn').addEventListener('click', () => {
        state.activeDept = d.id;
        el.activeDeptSelect.value = String(d.id);
        refresh(false);
      });
      card.querySelector('.dept-swatch').style.background = d.color;
      card.querySelector('.dept-meta').innerHTML = `<div class="mono">Target: ${fmtInt(d.sqft)} sqft</div><div class="mono">Painted: ${fmtInt((counts[d.id] || 0) * cellArea(state.ft))} sqft</div>`;
      card.querySelector('.dept-stats').innerHTML = `<div>ID ${d.id}</div><div>${d.capped ? 'Capped' : 'Flexible'} · ${d.grow ? 'Can grow' : 'No growth'} · ${d.shrink ? 'Can shrink' : 'No shrink'}</div>`;
      const controls = card.querySelector('.dept-controls');
      controls.innerHTML = `
        <div class="dept-flag-grid">
          <label class="dept-flag"><input type="checkbox" ${d.locked ? 'checked' : ''} data-flag="locked"> Lock</label>
          <label class="dept-flag"><input type="checkbox" ${d.grow ? 'checked' : ''} data-flag="grow"> Grow</label>
          <label class="dept-flag"><input type="checkbox" ${d.shrink ? 'checked' : ''} data-flag="shrink"> Shrink</label>
          <label class="dept-flag"><input type="checkbox" ${d.capped ? 'checked' : ''} data-flag="capped"> Cap</label>
        </div>
        <div class="dept-field-grid">
          <label class="dept-field"><span>Sqft</span><input type="number" value="${d.sqft}" min="100" step="100" data-field="sqft"></label>
          <label class="dept-field color-field"><span>Color</span><input type="color" value="${normalizeHex(d.color)}" data-field="color"></label>
        </div>
      `;
      controls.querySelectorAll('input[data-flag]').forEach((input) => {
        input.addEventListener('change', () => {
          d[input.dataset.flag] = input.checked;
          sanitizeState();
          persistState();
          refresh(false);
        });
      });
      controls.querySelector('[data-field="sqft"]').addEventListener('change', (e) => {
        d.sqft = Math.max(100, Number(e.target.value || d.sqft));
        persistState();
        refresh(false);
      });
      controls.querySelector('[data-field="color"]').addEventListener('input', (e) => {
        d.color = e.target.value;
        persistState();
        refresh(false);
      });
      const editBar = document.createElement('div');
      editBar.className = 'dept-button-row';
      const renameBtn = mkButton('Rename', 'ghost-btn', () => renameDept(d.id));
      const removeBtn = mkButton('Remove', 'ghost-btn danger', () => removeDept(d.id));
      editBar.append(renameBtn, removeBtn);
      card.appendChild(editBar);
      el.deptList.appendChild(card);
    });

    qs('#addDeptBtn').onclick = addDept;
  }
  function normalizeHex(color) {
    if (!color) return '#94a3b8';
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color;
    return `#${String(color).replace('#', '').slice(0, 6).padEnd(6, '0')}`;
  }
  function mkButton(text, className, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }
  function renameDept(id) {
    const d = state.depts.find((x) => x.id === id);
    if (!d) return;
    const name = prompt('Department name', d.name);
    if (name == null) return;
    const abbr = prompt('Abbreviation', d.abbr);
    d.name = name.trim() || d.name;
    d.abbr = normalizeAbbr(d.name, abbr, d.id);
    persistState();
    refresh();
  }
  function removeDept(id) {
    const painted = state.cells.includes(id);
    if (!confirm(`${painted ? 'This department is painted on the grid. ' : ''}Remove ${deptLabel(id)}?`)) return;
    state.depts = state.depts.filter((d) => d.id !== id);
    state.flowPairs = state.flowPairs.filter((p) => p.a !== id && p.b !== id);
    state.rewardPairs = state.rewardPairs.filter((p) => p.a !== id && p.b !== id);
    state.cells = state.cells.map((c) => (c === id ? 0 : c));
    sanitizeState();
    persistState();
    refresh();
  }
  function addDept() {
    const id = nextDeptId();
    const name = prompt('New department name', `Department ${id}`);
    if (!name) return;
    const abbr = prompt('Abbreviation', `D${id}`);
    state.depts.push({
      id,
      name: name.trim(),
      abbr: normalizeAbbr(name, abbr, id),
      color: nextColor(state.depts.length),
      sqft: 2500,
      locked: false,
      capped: false,
      grow: false,
      shrink: false,
    });
    state.activeDept = id;
    persistState();
    refresh();
  }

  function renderWorkspace() {
    const scores = currentScores();
    const eTotal = scores.adetails.filter((a) => a.r === 'E').length;
    const eMet = scores.adetails.filter((a) => a.r === 'E' && a.adj).length;
    const xVio = scores.adetails.filter((a) => a.r === 'X' && a.adj).length;

    el.tabOverview.innerHTML = `
      <article class="panel-block">
        <div class="block-head"><h3>Current scorecard</h3></div>
        <div class="kpi-list">
          <div class="kpi-chip"><div class="kpi-label">D-Score</div><div class="kpi-value mono">${fmtInt(scores.ds)}</div></div>
          <div class="kpi-chip"><div class="kpi-label">A-Score</div><div class="kpi-value mono">${fmtInt(scores.as)}</div></div>
          <div class="kpi-chip"><div class="kpi-label">E-pairs</div><div class="kpi-value mono">${eMet}/${eTotal}</div></div>
          <div class="kpi-chip"><div class="kpi-label">X-violations</div><div class="kpi-value mono">${fmtInt(xVio)}</div></div>
        </div>
      </article>
      <article class="panel-block">
        <div class="block-head"><h3>Coverage</h3></div>
        <p class="section-note">${state.depts.length} departments · ${state.cells.filter(Boolean).length} painted cells · ${fmtInt(totalPaintedSqft())} painted sqft.</p>
      </article>
    `;

    el.tabAlgorithm.innerHTML = `
      <article class="panel-block">
        <div class="block-head"><h3>Run optimizer</h3></div>
        <div class="form-grid">
          <label><span>Algorithm</span><select id="algoSelect">${Object.entries(ALGO_META).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
          <label><span>Column bands</span><input id="ncInput" type="number" min="1" max="${state.gw}" value="${state.nc}"></label>
          <label><span>Max iterations</span><input id="maxItInput" type="number" min="1" max="200" value="${state.maxIt}"></label>
          <label><span>Trials</span><input id="trialsInput" type="number" min="1" max="100" value="${state.trials}"></label>
          <label><span>Improvement iters</span><input id="impItInput" type="number" min="1" max="200" value="${state.impIt}"></label>
          <label><span>Upper bound</span><select id="upperBoundSelect"><option value="true" ${state.upperBound ? 'selected' : ''}>On</option><option value="false" ${!state.upperBound ? 'selected' : ''}>Off</option></select></label>
        </div>
        <div class="panel-block" style="margin-top:12px;">
          <div class="section-note" id="algoDesc"></div>
        </div>
        <div class="inline-stack" style="margin-top:12px;">
          <button id="runAlgoBtn" class="primary-btn" type="button">Generate layout</button>
          <button id="applySylvaBtn" class="ghost-btn" type="button">Apply Sylva expansion</button>
          <button id="resetSizesBtn" class="ghost-btn" type="button">Reset default sizes</button>
        </div>
      </article>
      <article class="panel-block">
        <div class="block-head"><h3>Grid settings</h3></div>
        <div class="form-grid">
          <label><span>Grid width</span><input id="gridWidthInput" type="number" min="5" max="80" value="${state.gw}"></label>
          <label><span>Grid height</span><input id="gridHeightInput" type="number" min="5" max="80" value="${state.gh}"></label>
          <label><span>Feet per cell</span><input id="gridFtInput" type="number" min="1" max="100" value="${state.ft}"></label>
        </div>
        <div class="inline-stack" style="margin-top:12px;">
          <button id="applyGridBtn" class="ghost-btn" type="button">Apply grid settings</button>
        </div>
      </article>
    `;
    const algoSelect = qs('#algoSelect');
    algoSelect.value = state.algo;
    const algoDesc = qs('#algoDesc');
    const setAlgoDesc = () => { algoDesc.textContent = ALGO_META[algoSelect.value].desc; };
    setAlgoDesc();
    algoSelect.addEventListener('change', () => { state.algo = algoSelect.value; setAlgoDesc(); persistState(); });
    qs('#ncInput').addEventListener('change', (e) => { state.nc = Number(e.target.value); persistState(); });
    qs('#maxItInput').addEventListener('change', (e) => { state.maxIt = Number(e.target.value); persistState(); });
    qs('#trialsInput').addEventListener('change', (e) => { state.trials = Number(e.target.value); persistState(); });
    qs('#impItInput').addEventListener('change', (e) => { state.impIt = Number(e.target.value); persistState(); });
    qs('#upperBoundSelect').addEventListener('change', (e) => { state.upperBound = e.target.value === 'true'; persistState(); });
    qs('#runAlgoBtn').addEventListener('click', runOptimizer);
    qs('#applySylvaBtn').addEventListener('click', applySylvaExpansion);
    qs('#resetSizesBtn').addEventListener('click', resetDefaultSizes);
    qs('#applyGridBtn').addEventListener('click', applyGridSettings);

    const flowTable = state.flowPairs.slice(0, 20).map((p) => `<tr><td>${deptLabel(p.a)}</td><td>${deptLabel(p.b)}</td><td class="mono">${fmtInt(p.flow)}</td></tr>`).join('');
    const rewardTable = state.rewardPairs.slice(0, 20).map((p) => `<tr><td>${deptLabel(p.a)}</td><td>${deptLabel(p.b)}</td><td>${p.r}</td></tr>`).join('');
    el.tabData.innerHTML = `
      <article class="panel-block">
        <div class="block-head"><h3>Flow pairs</h3><span class="badge warn">${state.flowPairs.length}</span></div>
        <div>${flowTable ? `<table class="mini-table"><thead><tr><th>A</th><th>B</th><th>Flow</th></tr></thead><tbody>${flowTable}</tbody></table>` : `<div class="empty-state">No flow data loaded.</div>`}</div>
      </article>
      <article class="panel-block">
        <div class="block-head"><h3>REL pairs</h3><span class="badge warn">${state.rewardPairs.length}</span></div>
        <div>${rewardTable ? `<table class="mini-table"><thead><tr><th>A</th><th>B</th><th>REL</th></tr></thead><tbody>${rewardTable}</tbody></table>` : `<div class="empty-state">No REL data loaded.</div>`}</div>
      </article>
      <article class="panel-block">
        <div class="block-head"><h3>State JSON</h3></div>
        <textarea class="json-area" readonly>${escapeHtml(JSON.stringify(exportStateObject(), null, 2))}</textarea>
      </article>
    `;

    el.tabIterations.innerHTML = state.iterations.map((slot, idx) => {
      if (!slot.saved) return `<article class="panel-block"><div class="block-head"><h3>${slot.name}</h3><span class="badge warn">Empty</span></div><div class="section-note">Save the current layout here from the bottom toolbar.</div></article>`;
      return `<article class="panel-block"><div class="block-head"><h3>${slot.name}</h3><span class="badge good">Saved</span></div><div class="section-note">${slot.notes || 'No notes'}</div><div class="section-note mono">D ${fmtInt(slot.ds)} · A ${fmtInt(slot.as)} · E ${slot.eMet}/${slot.eTotal} · X ${fmtInt(slot.xVio)}</div><div class="section-note">${slot.algo || 'Manual'} · ${slot.ts || ''}</div><div class="inline-stack"><button class="ghost-btn" type="button" data-load-slot="${idx}">Load</button></div></article>`;
    }).join('');
    el.tabIterations.querySelectorAll('[data-load-slot]').forEach((btn) => btn.addEventListener('click', () => loadSlot(Number(btn.dataset.loadSlot))));

    el.tabLog.innerHTML = `<div class="log-list">${state.log.slice().reverse().map((item) => `<div class="log-item">${escapeHtml(item)}</div>`).join('')}</div>`;
  }

  function applyGridSettings() {
    const newGw = clamp(Number(qs('#gridWidthInput').value), 5, 80);
    const newGh = clamp(Number(qs('#gridHeightInput').value), 5, 80);
    const newFt = clamp(Number(qs('#gridFtInput').value), 1, 100);
    const newCells = initCells(newGw, newGh);
    for (let y = 0; y < Math.min(state.gh, newGh); y += 1) {
      for (let x = 0; x < Math.min(state.gw, newGw); x += 1) {
        newCells[y * newGw + x] = state.cells[y * state.gw + x];
      }
    }
    state.gw = newGw;
    state.gh = newGh;
    state.ft = newFt;
    state.cells = newCells;
    sanitizeState();
    log(`Applied grid settings: ${state.gw}×${state.gh} @ ${state.ft} ft.`);
    persistState();
    refresh();
  }

  function applySylvaExpansion() {
    state.depts.forEach((d) => {
      d.grow = false;
      d.shrink = false;
      if (d.name === 'Die Casting') d.sqft = 9000;
      if (d.name === 'Machining 2') d.sqft = 10800;
      if (['Assembly & Finishing', 'Testing', 'Finished Goods'].includes(d.name)) d.shrink = true;
      if (['Die Casting', 'Machining 2'].includes(d.name)) d.grow = true;
    });
    log('Applied Sylva expansion sizing preset.');
    persistState();
    refresh();
  }
  function resetDefaultSizes() {
    const defaults = new Map(DEFAULT_DEPTS.map((d) => [d.id, d]));
    state.depts.forEach((d, idx) => {
      const base = defaults.get(d.id);
      if (base) {
        d.sqft = base.sqft;
        d.grow = base.grow;
        d.shrink = base.shrink;
        d.capped = base.capped;
      } else {
        d.color = d.color || nextColor(idx);
      }
    });
    log('Restored default sizing and grow/shrink flags where available.');
    persistState();
    refresh();
  }
  function runOptimizer() {
    sanitizeState();
    const [ok, msg] = validateAlgo(state.algo, state.flowPairs, state.rewardPairs);
    if (!ok) {
      alert(msg);
      return;
    }
    const lockedData = getLockedData(state.cells, state.lockedIds, state.gw, state.gh, state.ft);
    try {
      log(`Running ${ALGO_META[state.algo].label}.`);
      const result = dispatchAlgo(state.algo, state.nc, state.maxIt, state.trials, state.impIt, state.gw, state.gh, state.ft, state.depts, state.flowPairs, state.rewardPairs, lockedData, state.upperBound);
      state.cells = buildLayoutCells(result.ids, state.nc, state.gw, state.gh, state.ft, state.depts, lockedData, state.upperBound);
      log(`Finished ${ALGO_META[state.algo].label}: D ${fmtInt(result.ds)}, A ${fmtInt(result.as)}.`);
      persistState();
      refresh();
    } catch (err) {
      console.error(err);
      alert(`Algorithm failed: ${err.message}`);
      log(`Algorithm error: ${err.message}`);
      refresh(false);
    }
  }

  function renderSlots() {
    const scores = currentScores();
    const eTotal = scores.adetails.filter((a) => a.r === 'E').length;
    const eMet = scores.adetails.filter((a) => a.r === 'E' && a.adj).length;
    const xVio = scores.adetails.filter((a) => a.r === 'X' && a.adj).length;
    el.iterationSlots.innerHTML = '';
    state.iterations.forEach((slot, idx) => {
      const card = document.createElement('article');
      card.className = `slot-card ${slot.saved ? 'saved' : ''}`;
      card.innerHTML = `
        <div class="slot-title">${slot.name}</div>
        <div class="slot-meta">${slot.saved ? `${slot.notes || 'Saved layout'}<br><span class="mono">D ${fmtInt(slot.ds)} · A ${fmtInt(slot.as)}</span>` : 'Empty slot'}</div>
        <div class="slot-actions"></div>
      `;
      const actions = card.querySelector('.slot-actions');
      actions.append(
        mkButton('Save', 'ghost-btn', () => saveSlot(idx, scores, eMet, eTotal, xVio)),
        mkButton('Load', 'ghost-btn', () => loadSlot(idx)),
        mkButton('Clear', 'ghost-btn danger', () => clearSlot(idx))
      );
      el.iterationSlots.appendChild(card);
    });
  }
  function saveSlot(idx, scores, eMet, eTotal, xVio) {
    state.iterations[idx] = {
      saved: true,
      name: state.iterations[idx].name,
      notes: state.iterNotes || state.iterations[idx].notes || '',
      cells: [...state.cells],
      ds: scores.ds,
      as: scores.as,
      eMet,
      eTotal,
      xVio,
      algo: ALGO_META[state.algo]?.label || 'Manual',
      ts: new Date().toLocaleString(),
    };
    log(`Saved current layout to slot ${idx + 1}.`);
    persistState();
    refresh(false);
  }
  function loadSlot(idx) {
    const slot = state.iterations[idx];
    if (!slot?.saved || !slot.cells) return;
    state.cells = [...slot.cells];
    state.iterNotes = slot.notes || '';
    el.notesInput.value = state.iterNotes;
    log(`Loaded slot ${idx + 1}.`);
    persistState();
    refresh();
  }
  function clearSlot(idx) {
    if (!confirm(`Clear slot ${idx + 1}?`)) return;
    state.iterations[idx] = { saved: false, name: ITER_NAMES[idx], notes: '', cells: null, ds: null, as: null, eMet: null, eTotal: null, xVio: null, algo: '', ts: '' };
    log(`Cleared slot ${idx + 1}.`);
    persistState();
    refresh(false);
  }

  function bindBottomBar() {
    el.notesInput.addEventListener('input', (e) => {
      state.iterNotes = e.target.value;
      persistState();
    });
    qs('#paintRectBtn').addEventListener('click', () => {
      sanitizeState();
      applyRect(state.rect.x1, state.rect.y1, state.rect.x2, state.rect.y2, state.activeDept);
    });
    qs('#eraseRectBtn').addEventListener('click', () => {
      sanitizeState();
      applyRect(state.rect.x1, state.rect.y1, state.rect.x2, state.rect.y2, 0);
    });
    qs('#clearGridBtn').addEventListener('click', () => {
      const locked = lockSet();
      state.cells = state.cells.map((c) => (c && locked.has(c) ? c : 0));
      log('Cleared all unlocked cells.');
      persistState();
      refresh();
    });
    if (el.uiScaleRange) {
      el.uiScaleRange.addEventListener('input', (e) => {
        state.uiScale = Number(e.target.value);
        applyUiScale();
      });
      el.uiScaleRange.addEventListener('change', () => {
        persistState();
        refresh(false);
      });
    }
    qs('#saveBrowserBtn').addEventListener('click', () => { persistState(true); });
    qs('#resetBtn').addEventListener('click', resetApp);
    qs('#exportJsonBtn').addEventListener('click', exportJson);
    qs('#exportWorkbookBtn').addEventListener('click', exportWorkbook);
    qs('#downloadTemplateBtn').addEventListener('click', exportTemplate);
    el.workbookInput.addEventListener('change', importFile);
    el.activeDeptSelect.addEventListener('change', (e) => { state.activeDept = Number(e.target.value); persistState(); refresh(false); });
    el.toolSelect.addEventListener('change', (e) => { state.tool = e.target.value; persistState(); });
    [el.rectX1, el.rectY1, el.rectX2, el.rectY2].forEach((input) => input.addEventListener('change', () => persistState()));
  }
  function resetApp() {
    if (!confirm('Reset the app to the built-in default dataset?')) return;
    state.gw = 35; state.gh = 25; state.ft = 10;
    state.cells = initCells(35, 25);
    state.depts = clone(DEFAULT_DEPTS);
    state.flowPairs = clone(DEFAULT_FLOW_PAIRS);
    state.rewardPairs = clone(DEFAULT_REWARD_PAIRS);
    state.lockedIds = [];
    state.upperBound = true;
    state.activeDept = 2;
    state.tool = 'rect';
    state.algo = 'craft';
    state.nc = 4; state.maxIt = 30; state.trials = 5; state.impIt = 20;
    state.iterNotes = '';
    state.iterations = defaultIterations();
    state.log = ['Reset to default state.'];
    state.dataSource = 'Built-in defaults';
    state.uiScale = 100;
    localStorage.removeItem('gyrolux-html-state');
    refresh();
  }
  function persistState(notify = false) {
    sanitizeState();
    localStorage.setItem('gyrolux-html-state', JSON.stringify(exportStateObject()));
    if (notify) log('Saved current state to browser local storage.');
  }
  function exportStateObject() {
    return {
      gw: state.gw, gh: state.gh, ft: state.ft, cells: state.cells, depts: state.depts,
      flowPairs: state.flowPairs, rewardPairs: state.rewardPairs, upperBound: state.upperBound,
      activeDept: state.activeDept, tool: state.tool, algo: state.algo, nc: state.nc, maxIt: state.maxIt,
      trials: state.trials, impIt: state.impIt, iterNotes: state.iterNotes, iterations: state.iterations,
      log: state.log, dataSource: state.dataSource, uiScale: state.uiScale,
      rect: { x1: Number(el.rectX1.value || 0), y1: Number(el.rectY1.value || 0), x2: Number(el.rectX2.value || 4), y2: Number(el.rectY2.value || 4) },
    };
  }
  function loadFromStorage() {
    const raw = localStorage.getItem('gyrolux-html-state');
    if (!raw) {
      state.cells = initCells(state.gw, state.gh);
      return;
    }
    try {
      const data = JSON.parse(raw);
      Object.assign(state, data);
      state.depts = (data.depts || clone(DEFAULT_DEPTS)).map((d, idx) => ({
        id: Number(d.id), name: d.name || `Department ${idx + 1}`,
        abbr: normalizeAbbr(d.name, d.abbr, d.id), color: normalizeHex(d.color || nextColor(idx)), sqft: Number(d.sqft || 1000),
        locked: Boolean(d.locked), capped: Boolean(d.capped), grow: Boolean(d.grow), shrink: Boolean(d.shrink),
      }));
      state.cells = Array.isArray(data.cells) ? data.cells.map((n) => Number(n || 0)) : initCells(state.gw, state.gh);
      state.flowPairs = (data.flowPairs || []).map((p) => ({ a: Number(p.a), b: Number(p.b), flow: Number(p.flow || 0) })).filter((p) => p.a && p.b && p.a !== p.b);
      state.rewardPairs = (data.rewardPairs || []).map((p) => ({ a: Number(p.a), b: Number(p.b), r: String(p.r || 'I').toUpperCase() })).filter((p) => p.a && p.b && p.a !== p.b);
      state.iterations = Array.isArray(data.iterations) && data.iterations.length === 5 ? data.iterations : defaultIterations();
      state.log = Array.isArray(data.log) ? data.log : ['Loaded local state.'];
      state.uiScale = clamp(Number(data.uiScale || 100), 75, 135);
      if (data.rect) {
        el.rectX1.value = data.rect.x1 ?? 0;
        el.rectY1.value = data.rect.y1 ?? 0;
        el.rectX2.value = data.rect.x2 ?? 4;
        el.rectY2.value = data.rect.y2 ?? 4;
      }
    } catch (err) {
      console.warn(err);
      state.cells = initCells(state.gw, state.gh);
      log('Stored browser state was invalid, so defaults were restored.');
    }
  }
  function exportJson() {
    downloadBlob(new Blob([JSON.stringify(exportStateObject(), null, 2)], { type: 'application/json' }), `gyrolux-state-${stamp()}.json`);
    log('Exported JSON state file.');
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  function importFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.toLowerCase().endsWith('.json')) {
          const data = JSON.parse(e.target.result);
          Object.assign(state, data);
          state.dataSource = `Imported JSON: ${file.name}`;
          sanitizeState();
          persistState();
          refresh();
          log(`Imported JSON state from ${file.name}.`);
          return;
        }
        const wb = XLSX.read(e.target.result, { type: 'array' });
        importWorkbookData(wb, file.name);
      } catch (err) {
        console.error(err);
        alert(`Import failed: ${err.message}`);
        log(`Import failed: ${err.message}`);
      } finally {
        ev.target.value = '';
      }
    };
    if (file.name.toLowerCase().endsWith('.json')) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }
  function nk(v) { return String(v ?? '').toLowerCase().replace(/[ _]/g, ''); }
  function num(v) { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : null; }
  function findSheet(names, aliases) { return names.find((n) => aliases.map(nk).includes(nk(n))); }
  function importWorkbookData(wb, fileName = 'workbook') {
    const names = wb.SheetNames || [];
    const deptSh = findSheet(names, ['departments', 'department', 'depts']);
    const flowSh = findSheet(names, ['flowpairs', 'flowpair', 'dscorepairs', 'distancepairs', 'flow']);
    const flowMx = findSheet(names, ['flowmatrix', 'flow_matrix', 'dscorematrix', 'distancematrix']);
    const rewardSh = findSheet(names, ['rewardpairs', 'rewardpair', 'relpairs', 'adjacencypairs', 'relchart']);
    const rewardMx = findSheet(names, ['rewardmatrix', 'relmatrix', 'adjacencymatrix']);
    const layoutSh = findSheet(names, ['layout', 'gridlayout', 'blocklayout', 'cells', 'plan']);
    const metaSh = findSheet(names, ['meta', 'settings', 'grid']);

    let gw = state.gw, gh = state.gh, ft = state.ft;
    if (metaSh) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[metaSh], { header: 1, defval: null });
      rows.forEach((row) => {
        const k = nk(row?.[0]);
        if (['gridwidth', 'width', 'w'].includes(k)) gw = Number(num(row?.[1]) || gw);
        if (['gridheight', 'height', 'h'].includes(k)) gh = Number(num(row?.[1]) || gh);
        if (['feetpercell', 'ft', 'cellsize'].includes(k)) ft = Number(num(row?.[1]) || ft);
      });
    }

    let depts = clone(DEFAULT_DEPTS);
    if (deptSh) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[deptSh], { header: 1, defval: null });
      if (rows.length > 1) {
        const headers = rows[0].map(nk);
        const col = (aliases) => aliases.map(nk).find((a) => headers.includes(a)) ? headers.indexOf(aliases.map(nk).find((a) => headers.includes(a))) : null;
        const ic = col(['id', 'deptid']);
        const nc = col(['name', 'department', 'dept']);
        const ac = col(['abbr', 'abbreviation', 'code']);
        const sc = col(['sqft', 'space', 'area', 'requiredsqft']);
        const cc = col(['color', 'colour']);
        const gc = col(['grow', 'cangrow']);
        const shc = col(['shrink', 'canshrink']);
        const capc = col(['capped', 'cap', 'max']);
        const lc = col(['locked', 'lock', 'fixed', 'pin']);
        const out = [];
        let autoId = 1;
        for (const row of rows.slice(1)) {
          const name = String((nc != null ? row[nc] : '') || '').trim();
          if (!name) continue;
          let rid = num(ic != null ? row[ic] : null);
          if (rid == null || out.some((d) => d.id === Number(rid))) {
            while (out.some((d) => d.id === autoId)) autoId += 1;
            rid = autoId;
            autoId += 1;
          }
          const boolCol = (idx) => ['1', 'true', 'yes', 'y'].includes(String((idx != null ? row[idx] : '') || '').trim().toLowerCase());
          out.push({
            id: Number(rid),
            name,
            abbr: normalizeAbbr(name, ac != null ? row[ac] : '', rid),
            sqft: Math.max(1, Number(num(sc != null ? row[sc] : null) || 2000)),
            color: String((cc != null ? row[cc] : '') || '').trim() || nextColor(out.length),
            grow: boolCol(gc), shrink: boolCol(shc), capped: boolCol(capc), locked: boolCol(lc),
          });
        }
        if (out.length) depts = out;
      }
    }

    const resolver = new Map();
    depts.forEach((d) => {
      [d.id, String(d.id), d.name, d.abbr].forEach((k) => resolver.set(nk(k), d.id));
    });
    const resolve = (v) => resolver.get(nk(v));

    const parsePairs = (shName, kind) => {
      if (!shName) return [];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[shName], { header: 1, defval: null });
      if (rows.length < 2) return [];
      const hdr = rows[0].map(nk);
      const col = (aliases) => aliases.map(nk).find((a) => hdr.includes(a)) ? hdr.indexOf(aliases.map(nk).find((a) => hdr.includes(a))) : null;
      const ac = col(['depta', 'from', 'a', 'dept1']);
      const bc = col(['deptb', 'to', 'b', 'dept2']);
      const vc = kind === 'flow' ? col(['flow', 'score', 'weight', 'volume', 'load']) : col(['rating', 'rel', 'reward', 'adjacency', 'closeness', 'relationship', 'value']);
      const out = [];
      const seen = new Set();
      rows.slice(1).forEach((row) => {
        const a = resolve(ac != null ? row[ac] : '');
        const b = resolve(bc != null ? row[bc] : '');
        if (!a || !b || a === b) return;
        const key = `${Math.min(a, b)}|${Math.max(a, b)}`;
        if (seen.has(key)) return;
        if (kind === 'flow') {
          const v = num(vc != null ? row[vc] : null);
          if (v) { out.push({ a, b, flow: v }); seen.add(key); }
        } else {
          const rv = String(vc != null ? row[vc] : '').trim().toUpperCase();
          if (rv in REWARD_VALUES) { out.push({ a, b, r: rv }); seen.add(key); }
        }
      });
      return out;
    };

    const parseMatrix = (shName, kind) => {
      if (!shName) return [];
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[shName], { header: 1, defval: null });
      if (!aoa.length || aoa[0].length < 2) return [];
      const colLabels = aoa[0].slice(1);
      const out = [];
      const seen = new Set();
      aoa.slice(1).forEach((row) => {
        const a = resolve(row[0]);
        if (!a) return;
        colLabels.forEach((cl, ci) => {
          const b = resolve(cl);
          if (!b || a === b) return;
          const key = `${Math.min(a, b)}|${Math.max(a, b)}`;
          if (seen.has(key)) return;
          const raw = row[ci + 1];
          if (kind === 'flow') {
            const v = num(raw);
            if (v) { out.push({ a, b, flow: v }); seen.add(key); }
          } else {
            const rv = String(raw || '').trim().toUpperCase();
            if (rv in REWARD_VALUES) { out.push({ a, b, r: rv }); seen.add(key); }
          }
        });
      });
      return out;
    };

    const flowPairs = parsePairs(flowSh, 'flow').length ? parsePairs(flowSh, 'flow') : parseMatrix(flowMx, 'flow');
    const rewardPairs = parsePairs(rewardSh, 'reward').length ? parsePairs(rewardSh, 'reward') : parseMatrix(rewardMx, 'reward');

    let cells = initCells(gw, gh);
    if (layoutSh) {
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[layoutSh], { header: 1, defval: null });
      cells = initCells(gw, gh);
      for (let y = 0; y < Math.min(gh, aoa.length); y += 1) {
        const row = aoa[y] || [];
        for (let x = 0; x < Math.min(gw, row.length); x += 1) {
          const did = resolve(row[x]);
          if (did) cells[y * gw + x] = did;
        }
      }
    }

    state.gw = gw; state.gh = gh; state.ft = ft;
    state.depts = depts.map((d) => ({ ...d, color: normalizeHex(d.color) }));
    state.flowPairs = flowPairs;
    state.rewardPairs = rewardPairs;
    state.cells = cells;
    state.activeDept = state.depts[0]?.id || 1;
    state.dataSource = `Imported workbook: ${fileName}`;
    sanitizeState();
    persistState();
    log(`Imported workbook ${fileName}.`);
    refresh();
  }

  function exportWorkbook() {
    const scores = currentScores();
    const rowsDepts = [['ID', 'Name', 'Abbr', 'Sqft', 'Color', 'Grow', 'Shrink', 'Capped', 'Locked']].concat(
      state.depts.map((d) => [d.id, d.name, d.abbr, d.sqft, d.color, d.grow, d.shrink, d.capped, d.locked])
    );
    const rowsFlow = [['DeptA', 'DeptB', 'Flow']].concat(state.flowPairs.map((p) => [deptLabel(p.a), deptLabel(p.b), p.flow]));
    const rowsReward = [['DeptA', 'DeptB', 'Rating']].concat(state.rewardPairs.map((p) => [deptLabel(p.a), deptLabel(p.b), p.r]));
    const layout = [];
    for (let y = 0; y < state.gh; y += 1) {
      const row = [];
      for (let x = 0; x < state.gw; x += 1) row.push(deptLabel(state.cells[y * state.gw + x]) || '');
      layout.push(row);
    }
    const meta = [['gridWidth', state.gw], ['gridHeight', state.gh], ['feetPerCell', state.ft], ['dataSource', state.dataSource], ['dScore', scores.ds], ['aScore', scores.as]];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsDepts), 'Departments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsFlow), 'FlowPairs');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsReward), 'RewardPairs');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(layout), 'Layout');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), 'Meta');
    XLSX.writeFile(wb, `gyrolux-layout-${stamp()}.xlsx`);
    log('Exported current workbook as XLSX.');
  }
  function exportTemplate() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['ID', 'Name', 'Abbr', 'Sqft', 'Color', 'Grow', 'Shrink', 'Capped', 'Locked'], ...DEFAULT_DEPTS.map((d) => [d.id, d.name, d.abbr, d.sqft, d.color, d.grow, d.shrink, d.capped, d.locked])]), 'Departments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['DeptA', 'DeptB', 'Flow'], ...DEFAULT_FLOW_PAIRS.map((p) => [p.a, p.b, p.flow])]), 'FlowPairs');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['DeptA', 'DeptB', 'Rating'], ...DEFAULT_REWARD_PAIRS.map((p) => [p.a, p.b, p.r])]), 'RewardPairs');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['gridWidth', 35], ['gridHeight', 25], ['feetPerCell', 10]]), 'Meta');
    XLSX.writeFile(wb, 'gyrolux-template.xlsx');
    log('Downloaded workbook template.');
  }
  function stamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function syncInputs() {
    applyUiScale();
    el.toolSelect.value = state.tool;
    el.notesInput.value = state.iterNotes || '';
    el.rectX1.value = el.rectX1.value || 0;
    el.rectY1.value = el.rectY1.value || 0;
    el.rectX2.value = el.rectX2.value || Math.min(4, state.gw - 1);
    el.rectY2.value = el.rectY2.value || Math.min(4, state.gh - 1);
  }
  function refresh(full = true) {
    sanitizeState();
    syncInputs();
    renderDeptSelect();
    if (full) renderDeptSidebar();
    renderGrid();
    renderMetrics();
    renderWorkspace();
    renderSlots();
  }

  function init() {
    bindPanels();
    bindBottomBar();
    loadFromStorage();
    if (!state.cells.length) state.cells = initCells(state.gw, state.gh);
    sanitizeState();
    log('Loaded static HTML application.');
    refresh();
  }

  init();
})();
