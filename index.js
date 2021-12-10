'use strict';

let matrix = [];
let r = [];

function updateSize() {
  let n = document.getElementById('size').value;
  matrix = [];
  r = [];
  for (let i = 0; i < n; ++i) {
    matrix[i] = [];
    r[i] = {x: Math.random(), y: Math.random()};
    for (let ii = 0; ii < n; ++ii) {
      let r = Math.random();
      matrix[i][ii] = (r > 0.7) + (r > 0.95);
    }
  }
  updateTable();
  draw();
}

function updateTable() {
  let n = matrix.length;
  console.log(n);
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
      row.insertAdjacentElement('beforeend', cell);
    }
  }
}

let resolution = 1000;
let radius = 0.02;
let r_ctx = radius * resolution;

function rToCtx(x) {
  return (x * (1 - radius * 2) + radius) * resolution;
}

function drawEdge(ctx, a, b, i) {
  console.log(i);
  ctx.beginPath();
  let ax = rToCtx(r[a].x);
  let ay = rToCtx(r[a].y);
  let bx = rToCtx(r[b].x);
  let by = rToCtx(r[b].y);
  if (a == b) {
    i = (i - 1) / 2 + 1;
    ax -= r_ctx * i / Math.SQRT2;
    ay -= r_ctx * i / Math.SQRT2;
    ctx.arc(ax, ay, r_ctx * i, 0, 2 * Math.PI, false);

    ctx.strokeStyle = "#E8A259";
  } else {
    let dx = bx - ax;
    let dy = by - ay;
    let norm = Math.sqrt(dx * dx + dy * dy);
    dx = dx / norm;
    dy = dy / norm;
    console.log(dx, dy);
    ax += dy * r_ctx * i / 3;
    ay -= dx * r_ctx * i / 3;
    bx += dy * r_ctx * i / 3;
    by -= dx * r_ctx * i / 3;
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);

    var grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, '#33FF33');
    grad.addColorStop(1, '#FF33FF');

    ctx.strokeStyle = grad;
  }
  ctx.stroke();
}

function draw() {
  let ctx = document.getElementById('canvas').getContext('2d');
  ctx.canvas.width = resolution;
  ctx.fillStyle = '#282828';
  ctx.fillRect(0, 0, resolution, resolution);
  let n = matrix.length;
  ctx.fillStyle = '#52ADE1';
  ctx.strokeStyle = '#33FF33';
  ctx.save();
  ctx.lineWidth = r_ctx / 6;
  ctx.font = '14px Serif';
  // Draw edges
  for (let i = 0; i < n; ++i) {
    for (let ii = 0; ii < n; ++ii) {
      for (let k = 1; k <= matrix[i][ii]; ++k) drawEdge(ctx, i, ii, k);
    }
  }

  // Draw vertices
  for (let i = 0; i < n; ++i) {
    ctx.beginPath();
    ctx.arc(rToCtx(r[i].x), rToCtx(r[i].y), r_ctx, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.fillText(`${i}`, rToCtx(r[i].x), rToCtx(r[i].y));
  }
  ctx.restore();
}


if (document.readyState == 'loading')
  window.addEventListener('DOMContentLoaded', updateSize);
else
  updateSize();