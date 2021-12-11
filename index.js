'use strict';

let matrix = [];
let r = [];
let v = [];

let loop = null;
let interval = 0.1;

function updateSize() {
  let n = document.getElementById('size').value;
  matrix = [];
  r = [];
  v = [];
  let threshold1 = Math.min(0.25, 20 / (n * n));
  let threshold2 = Math.min(0.05, 2 / (n * n));
  for (let i = 0; i < n; ++i) {
    matrix[i] = [];
    r[i] = {x: Math.random() - 0.5, y: Math.random() - 0.5};
    v[i] = {x: 0, y: 0};
    for (let ii = 0; ii < n; ++ii) {
      let r = Math.random();
      matrix[i][ii] = (r < threshold1) + (r < threshold2);
    }
  }
  for (let i = 0; i < n; ++i) {
    for (let ii = 0; ii < n; ++ii) {
      if (i > ii) continue;
      let e = matrix[i][ii] + matrix[ii][i];
      matrix[i][ii] = e;
      matrix[ii][i] = e;
    }
  }
  updateTable();
  draw();
  clearInterval(loop);
  loop = setInterval(physics, interval);
}

function updateTable() {
  let n = matrix.length;
  let table = document.getElementById('matrix');
  table.innerHTML = '';
  let thead = document.createElement('thead');
  table.insertAdjacentElement('beforeend', thead);
  for (let i = 0; i < n; ++i) {
    let cell = document.createElement('th');
    cell.innerHTML = `${i + 1}`;
    thead.insertAdjacentElement('beforeend', cell);
  }
  for (let i = 0; i < n; ++i) {
    let row = document.createElement('tr');
    table.insertAdjacentElement('beforeend', row);
    for (let ii = 0; ii < n; ++ii) {
      let cell = document.createElement('td');
      cell.innerHTML = `${matrix[i][ii]}`;
      cell.addEventListener('click', incCell.bind(this, i, ii));
      row.insertAdjacentElement('beforeend', cell);
    }
  }
}

function incCell(i, ii) {
  matrix[i][ii] += 1;
  matrix[ii][i] += 1;
  let rows = document.querySelectorAll('tr');
  rows[i].children[ii].innerHTML = `${matrix[i][ii]}`;
  rows[ii].children[i].innerHTML = `${matrix[i][ii]}`;
}

let resolution = 2000;
let radius = 0.015;
let r_ctx = radius * resolution;

function rToCtx(x) {
  return (x / 2 * (1 - radius * 6) + 0.5) * resolution;
}

function drawEdge(ctx, a, b, offset) {
  ctx.beginPath();
  let ax = rToCtx(r[a].x);
  let ay = rToCtx(r[a].y);
  let bx = rToCtx(r[b].x);
  let by = rToCtx(r[b].y);
  if (a == b) {
    let radius = r_ctx * (offset / 2 + 1);
    let dx = r[a].x;
    let dy = r[a].y;
    let norm = Math.sqrt(dx * dx + dy * dy);
    dx = dx / norm;
    dy = dy / norm;
    ax += dx * radius;
    ay += dy * radius;
    ctx.arc(ax, ay, radius, 0, 2 * Math.PI, false);
  } else {
    let dx = bx - ax;
    let dy = by - ay;
    let norm = Math.sqrt(dx * dx + dy * dy);
    if (norm == 0) return;
    dx = dx / norm;
    dy = dy / norm;
    ax += dy * r_ctx * offset / 3;
    ay -= dx * r_ctx * offset / 3;
    bx += dy * r_ctx * offset / 3;
    by -= dx * r_ctx * offset / 3;
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.stroke();
}

function draw() {
  let ctx = document.getElementById('canvas').getContext('2d');
  ctx.canvas.width = resolution;
  ctx.canvas.height = resolution;
  ctx.fillStyle = '#282828';
  ctx.fillRect(0, 0, resolution, resolution);
  let n = matrix.length;
  ctx.strokeStyle = 'white';
  ctx.save();
  ctx.lineWidth = r_ctx / 6;
  // Draw edges
  for (let i = 0; i < n; ++i) {
    for (let ii = 0; ii < n; ++ii) {
      if (i == ii) {
        for (let k = 0; k < matrix[i][ii] / 2; ++k) drawEdge(ctx, i, ii, k);
      } else if (i < ii) {
        let offset = (matrix[i][ii] - 1) / 2;
        for (let k = 0; k < matrix[i][ii]; ++k)
          drawEdge(ctx, i, ii, k - offset);
      }
    }
  }

  // Draw vertices
  ctx.font = '40px Serif';
  for (let i = 0; i < n; ++i) {
    let x = rToCtx(r[i].x);
    let y = rToCtx(r[i].y);
    ctx.beginPath();
    ctx.arc(x, y, r_ctx, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#52ADE1';
    ctx.fill();
    ctx.fillStyle = 'white';
    let text = `${i + 1}`;
    let metrics = ctx.measureText(text);
    x -= metrics.width / 2;
    y += metrics.actualBoundingBoxAscent / 2;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function physics() {
  let n = matrix.length;
  let kOut = 0.00001;
  let kEdge = kOut * 10 * n;
  let bDamp = 0.1;

  // Vertices force = k / r^2
  for (let i = 0; i < n; ++i) {
    for (let ii = 0; ii < n; ++ii) {
      let dx = r[ii].x - r[i].x;
      let dy = r[ii].y - r[i].y;
      let norm = Math.sqrt(dx * dx + dy * dy);
      if (norm <= 0.001) continue;
      dx = dx / norm;
      dy = dy / norm;
      let mag = kOut / (norm * norm);
      v[i].x += -dx * mag;
      v[i].y += -dy * mag;
    }
  }

  // Edges force = k * x
  for (let i = 0; i < n; ++i) {
    for (let ii = 0; ii < n; ++ii) {
      let mag = kEdge * matrix[i][ii];
      let dx = r[ii].x - r[i].x;
      let dy = r[ii].y - r[i].y;
      v[i].x += mag * dx;
      v[i].y += mag * dy;
      v[ii].x += -mag * dx;
      v[ii].y += -mag * dy;
    }
  }


  for (let i = 0; i < n; ++i) {
    // Damping
    v[i].x += -bDamp * v[i].x;
    v[i].y += -bDamp * v[i].y;

    r[i].x += v[i].x;
    r[i].y += v[i].y;
    let dx = r[i].x;
    let dy = r[i].y;
    let norm = Math.sqrt(dx * dx + dy * dy);
    if (norm > 1) {
      r[i].x = dx / norm;
      r[i].y = dy / norm;
    }
  }
  draw();
}


if (document.readyState == 'loading')
  window.addEventListener('DOMContentLoaded', updateSize);
else
  updateSize();