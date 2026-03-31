// ===== GLOBAL =====
let network;
let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);

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

// ===== GIẢI THÍCH =====
const explanations = {
    rlf: `
        <b>RLF</b>: Xây dựng từng tập độc lập<br>
        → Chọn đỉnh bậc cao nhất<br>
        → Loại các đỉnh kề<br>
    `,
    welsh: `
        <b>Welsh-Powell</b>: Sắp xếp theo bậc<br>
        → Gán màu lần lượt<br>
    `,
    dsatur: `
        <b>DSATUR</b>: Chọn đỉnh có độ bão hòa cao nhất<br>
        → Ưu tiên đỉnh có nhiều màu kề<br>
    `
};

function showExplanation() {
    const method = document.getElementById("method").value;
    document.getElementById("explanation").innerHTML = explanations[method];
}

// ===== RUN =====
async function run() {
    let timerInterval;
    let startTime = performance.now();

    // ⏳ TIMER REALTIME
    timerInterval = setInterval(() => {
        const now = performance.now();
        const t = (now - startTime).toFixed(0);

        document.getElementById("info").innerHTML = `
            ⏳ Đang chạy: ${t} ms
        `;
    }, 100);

    const text = document.getElementById("edges").value.trim();
    const method = document.getElementById("method").value;

    if (!text) {
        clearInterval(timerInterval); // 👉 QUAN TRỌNG
        alert("Nhập đồ thị trước!");
        return;
    }

    const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edges: text, method })
    });

    const data = await res.json();

    nodes.clear();
    edges.clear();

    // 👉 graph xám ban đầu
    nodes.add(
        data.nodes.map(n => ({
            ...n,
            color: "#9CA3AF"
        }))
    );
    edges.add(data.edges);

    renderInfo(data);

    // 👉 animation
    await animateAlgorithm(data);

    // ⛔ DỪNG TIMER (QUAN TRỌNG NHẤT)
    clearInterval(timerInterval);

    // ⏱ thời gian cuối
    const endTime = performance.now();
    const totalTime = (endTime - startTime).toFixed(0);

    document.getElementById("info").innerHTML += `
        <br><b>⏱ Thời gian hoàn thành:</b> ${totalTime} ms
    `;
}

// ===== HIỂN THỊ INFO =====
function renderInfo(data) {
    document.getElementById("info").innerHTML = `
        <b>Số đỉnh:</b> ${data.nodes.length} <br>
        <b>Số cạnh:</b> ${data.edges.length} <br>
        <b>Sắc số:</b> <span style="color:#10b981">${data.chromaticNumber}</span>
    `;

    let html = "";
    data.colorGroups.forEach(g => {
        html += `
            <div class="color-group">
                <b>Màu ${g.color}:</b> ${g.vertices.join(', ')}
            </div>
        `;
    });
    document.getElementById("colorList").innerHTML = html;
}

// ===== ANIMATION TỪNG BƯỚC =====
async function animateSteps(data) {
    const explainBox = document.getElementById("explanation");

    const palette = [
        "#EF4444", "#22C55E", "#3B82F6",
        "#F59E0B", "#A855F7", "#EC4899"
    ];

    explainBox.innerHTML += `<br><b>🎬 Bắt đầu tô màu...</b>`;

    for (let group of data.colorGroups) {

        explainBox.innerHTML += `<br>👉 Màu ${group.color}`;

        for (let v of group.vertices) {

            // highlight trước
            nodes.update({
                id: v,
                color: { background: "#facc15" }
            });

            explainBox.innerHTML += `<br>✔ Đang xét đỉnh ${v}`;

            await sleep(400);

            // 👉 gán màu thật
            nodes.update({
                id: v,
                color: {
                    background: palette[group.color % palette.length]
                }
            });

            await sleep(300);
        }
    }

    explainBox.innerHTML += `<br><b>✔ Hoàn thành!</b>`;
}

// ===== COMPARE =====
async function compare() {
    const text = document.getElementById("edges").value.trim();
    if (!text) return alert("Nhập đồ thị trước!");

    const methods = ['rlf', 'welsh', 'dsatur'];

    let resultHTML = "<h3>⚔️ So sánh</h3>";

    for (let m of methods) {
        const res = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ edges: text, method: m })
        });

        const data = await res.json();

        resultHTML += `
            <div class="color-group">
                <b>${m.toUpperCase()}</b>: ${data.chromaticNumber} màu
            </div>
        `;
    }

    document.getElementById("info").innerHTML = resultHTML;
}



// ===== CLEAR =====
function clearGraph() {
    nodes.clear();
    edges.clear();
    nodeId = 1;
}

async function animateAlgorithm(data) {
    const explainBox = document.getElementById("explanation");

    const palette = [
        "#EF4444", "#22C55E", "#3B82F6",
        "#F59E0B", "#A855F7", "#EC4899"
    ];

    explainBox.innerHTML += `<br><b>🎬 Bắt đầu thuật toán...</b>`;

    for (let step of data.steps) {

        if (step.type === "newColor") {
            explainBox.innerHTML += `<br><b>🎨 Tạo màu ${step.color}</b>`;
        }

        if (step.type === "select") {
            nodes.update({
                id: step.node,
                color: { background: "#facc15" }
            });

            explainBox.innerHTML += `<br>👉 Chọn đỉnh ${step.node}`;
        }

        if (step.type === "color") {
            nodes.update({
                id: step.node,
                color: {
                    background: palette[step.color % palette.length]
                }
            });

            explainBox.innerHTML += `<br>✔ Tô màu ${step.color} cho ${step.node}`;
        }

        if (step.type === "remove") {
            nodes.update({
                id: step.node,
                color: { background: "#d1d5db" }
            });

            explainBox.innerHTML += `<br>❌ Loại đỉnh ${step.node}`;
        }

        await sleep(500);
    }

    explainBox.innerHTML += `<br><b>✅ Hoàn thành!</b>`;
}

// ===== UTILS =====
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== INIT LOAD =====
window.onload = () => {
    init();
    showExplanation();
};