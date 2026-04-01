// ===== GLOBAL =====
let network;
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);

// 🎨 sinh màu vô hạn
function getColor(id) {
  const hue = (id * 137.508) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

const explanations = {
  welsh: `
        <b>Welsh-Powell</b><br>
        - Sắp xếp đỉnh theo bậc giảm dần<br>
        - Gán màu lần lượt
    `,
  rlf: `
        <b>RLF</b><br>
        - Chọn đỉnh bậc cao nhất<br>
        - Loại các đỉnh kề
    `,
  dsatur: `
        <b>DSATUR</b><br>
        - Chọn đỉnh có độ bão hòa cao nhất<br>
        - Ưu tiên đỉnh có nhiều màu kề
    `,
};
function showExplanation() {
  const method = document.getElementById("method").value;
  document.getElementById("explanation").innerHTML = explanations[method];
}
// ===== INIT =====
function init() {
    const container = document.getElementById("network");

    network = new vis.Network(container, {
        nodes: nodes,
        edges: edges
    }, {
        nodes: {
            shape: 'dot',
            size: 25,
            font: { size: 16 }
        },
        edges: {
            smooth: true
        },
        physics: {
            stabilization: { iterations: 200 }
        }
    });
}

// ===== RUN =====
async function run() {
  let timerInterval;
  let startTime = performance.now();

  timerInterval = setInterval(() => {
    const now = performance.now();
    const t = (now - startTime).toFixed(0);

    document.getElementById("info").innerHTML = `⏳ Đang chạy: ${t} ms`;
  }, 100);

  const text = document.getElementById("edges").value.trim();
  const method = document.getElementById("method").value;

  const res = await fetch("/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ edges: text, method: method }),
  });
  const data = await res.json();
  renderColorGroups(data);

  nodes.clear();
  edges.clear();

  // 👉 xám ban đầu
  nodes.add(
    data.nodes.map((n) => ({
      ...n,
      color: "#9CA3AF",
    })),
  );

  edges.add(data.edges);

  await animateAlgorithm(data);

  clearInterval(timerInterval);
}

// ===== ANIMATION =====
async function animateAlgorithm(data) {
  const explainBox = document.getElementById("explanation");

  explainBox.innerHTML += "<br><b>🎬 Bắt đầu...</b>";

  for (let step of data.steps) {
    if (step.type === "select") {
      nodes.update({
        id: step.node,
        color: { background: "#facc15" },
      });

      explainBox.innerHTML += `<br>👉 Chọn ${step.node}`;
    }

    if (step.type === "color") {
      nodes.update({
        id: step.node,
        color: {
          background: getColor(step.color),
        },
      });

      explainBox.innerHTML += `<br>🎨 ${step.node} → màu ${step.color}`;
    }

    await sleep(250);
  }

  explainBox.innerHTML += `<br><b>✅ Xong!</b>`;
}

// ===== UTILS =====
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function clearGraph() {
  // xoá graph
  nodes.clear();
  edges.clear();

  // xoá input
  document.getElementById("edges").value = "";

  // xoá info + explanation (nếu muốn)
  document.getElementById("info").innerHTML = "";
  document.getElementById("explanation").innerHTML = "";
  document.getElementById("colorList").innerHTML = "";
  // reset về trạng thái ban đầu
  showExplanation();
}

function renderColorGroups(data) {
  const box = document.getElementById("colorList");

  if (!data.colorGroups || data.colorGroups.length === 0) {
    box.innerHTML = "";
    return;
  }

  let html = "<h3>🎨 Lớp màu</h3>";

  data.colorGroups.forEach((group) => {
    html += `
            <div style="margin-bottom:8px">
                <span style="
                    display:inline-block;
                    width:12px;
                    height:12px;
                    background:${getColor(group.color)};
                    border-radius:50%;
                    margin-right:6px;
                "></span>
                <b>Màu ${group.color}:</b> ${group.vertices.join(", ")}
            </div>
        `;
  });

  box.innerHTML = html;
}
// ===== INIT =====
window.onload = () => {
  init();
  showExplanation();
};
