const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ====================== PARSE + VALIDATE ======================
function parseGraph(edgeText) {
  const lines = edgeText.trim().split('\n');
  const edgeSet = new Set();
  const vertices = new Set();
  const edges = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 2) continue;

    let u = parts[0];
    let v = parts[1];

    const valid = (x) => /^\d+$/.test(x) || /^[a-zA-Z]$/.test(x);

    if (!valid(u) || !valid(v)) {
      return { error: `Dòng ${i + 1}: đỉnh không hợp lệ` };
    }

    vertices.add(u);
    vertices.add(v);

    if (u !== v) {
      const key = [u, v].sort().join('-');
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ from: u, to: v });
      }
    }
  }

  return { vertices: Array.from(vertices), edges };
}

// ====================== RLF ======================
function RLF(vertices, edges) {
  const adj = {};
  vertices.forEach(v => adj[v] = new Set());
  edges.forEach(e => {
    adj[e.from].add(e.to);
    adj[e.to].add(e.from);
  });

  const color = {};
  let steps = [];
  let colorId = 1;
  let uncolored = new Set(vertices);

  while (uncolored.size > 0) {
    let candidates = new Set(uncolored);

    steps.push({ type: "newColor", color: colorId });

    while (candidates.size > 0) {

      let best = [...candidates].sort((a, b) => adj[b].size - adj[a].size)[0];

      steps.push({ type: "select", node: best });

      color[best] = colorId;
      steps.push({ type: "color", node: best, color: colorId });

      uncolored.delete(best);
      candidates.delete(best);

      for (let v of [...candidates]) {
        if (adj[best].has(v)) {
          steps.push({ type: "remove", node: v });
          candidates.delete(v);
        }
      }
    }

    colorId++;
  }

  return { color, chromatic: colorId - 1, steps };
}

// ====================== WELSH-POWELL ======================
function WelshPowell(vertices, edges) {
  const adj = {};
  vertices.forEach(v => adj[v] = new Set());
  edges.forEach(e => {
    adj[e.from].add(e.to);
    adj[e.to].add(e.from);
  });

  let steps = [];
  const sorted = [...vertices].sort((a, b) => adj[b].size - adj[a].size);

  const color = {};
  let colorId = 1;

  for (let v of sorted) {
    if (color[v]) continue;

    steps.push({ type: "newColor", color: colorId });

    color[v] = colorId;
    steps.push({ type: "color", node: v, color: colorId });

    for (let u of sorted) {
      if (!color[u]) {
        let ok = true;

        for (let k in color) {
          if (color[k] === colorId && adj[u].has(k)) {
            ok = false;
            steps.push({ type: "conflict", node: u });
            break;
          }
        }

        if (ok) {
          color[u] = colorId;
          steps.push({ type: "color", node: u, color: colorId });
        }
      }
    }

    colorId++;
  }

  return { color, chromatic: colorId - 1, steps };
}

// ====================== DSATUR ======================
function DSATUR(vertices, edges) {
  const adj = {};
  vertices.forEach(v => adj[v] = new Set());
  edges.forEach(e => {
    adj[e.from].add(e.to);
    adj[e.to].add(e.from);
  });

  const color = {};
  const saturation = {};
  const degree = {};
  let steps = [];

  vertices.forEach(v => {
    saturation[v] = 0;
    degree[v] = adj[v].size;
  });

  while (Object.keys(color).length < vertices.length) {

    let candidate = null;

    for (let v of vertices) {
      if (color[v]) continue;

      if (!candidate ||
        saturation[v] > saturation[candidate] ||
        (saturation[v] === saturation[candidate] && degree[v] > degree[candidate])) {
        candidate = v;
      }
    }

    steps.push({
      type: "select",
      node: candidate,
      saturation: saturation[candidate]
    });

    let used = new Set();
    adj[candidate].forEach(n => {
      if (color[n]) used.add(color[n]);
    });

    let c = 1;
    while (used.has(c)) c++;

    color[candidate] = c;

    steps.push({
      type: "color",
      node: candidate,
      color: c
    });

    // cập nhật saturation
    adj[candidate].forEach(n => {
      if (!color[n]) {
        const neighborColors = new Set();
        adj[n].forEach(x => {
          if (color[x]) neighborColors.add(color[x]);
        });
        saturation[n] = neighborColors.size;

        steps.push({
          type: "updateSat",
          node: n,
          value: saturation[n]
        });
      }
    });
  }

  return { color, chromatic: Math.max(...Object.values(color)), steps };
}

// ====================== BUILD RESPONSE ======================
function buildResult(vertices, edges, result) {
  const palette = [
    "#EF4444", "#22C55E", "#3B82F6", "#F59E0B",
    "#A855F7", "#EC4899", "#14B8A6", "#8B5CF6"
  ];

  const nodes = vertices.map(v => ({
    id: v,
    label: v,
    color: "#9CA3AF"
  }));

  const groups = {};
  for (let v in result.color) {
    const c = result.color[v];
    if (!groups[c]) groups[c] = [];
    groups[c].push(v);
  }

  const colorGroups = Object.keys(groups).map(c => ({
    color: c,
    vertices: groups[c]
  }));

  return {
    nodes,
    edges,
    colorGroups,
    chromaticNumber: result.chromatic
  };
}

// ====================== API ======================
app.post('/api/process', (req, res) => {
  const { edges, method = 'rlf' } = req.body;

  // ===== PARSE =====
  const parsed = parseGraph(edges);
  if (parsed.error) return res.json(parsed);

  let result;

  // ===== CHỌN THUẬT TOÁN =====
  if (method === 'dsatur') {
    result = DSATUR(parsed.vertices, parsed.edges);
  }
  else if (method === 'welsh') {
    result = WelshPowell(parsed.vertices, parsed.edges);
  }
  else {
    result = RLF(parsed.vertices, parsed.edges);
  }

  // ===== BUILD KẾT QUẢ =====
  const final = buildResult(parsed.vertices, parsed.edges, result);

  // ===== TRẢ VỀ (CÓ STEPS) =====
  res.json({
    ...final,
    steps: result.steps
  });
});

// ======================
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(3000, () =>
  console.log("🚀 http://localhost:3000")
);