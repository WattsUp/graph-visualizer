'use strict';

let matrix = [];
let r = [];
let rCircle = [];
let v = [];
let c = [];
let cMin = 0;
let cMax = 0;

let loop = null;
let modeCircle = true;
let interval = 0.1;

function updateSize() {
  modeCircle = !document.getElementById('mode').checked;
  let n = document.getElementById('size').value;
  matrix = [];
  r = [];
  rCircle = [];
  v = [];
  c = [];
  let threshold1 = Math.min(0.25, 20 / (n * n));
  let threshold2 = Math.min(0.05, 2 / (n * n));
  for (let i = 0; i < n; ++i) {
    matrix[i] = [];
    r[i] = {
      x: 0.8 * Math.cos(2 * Math.PI * i / n),
      y: 0.8 * Math.sin(2 * Math.PI * i / n)
    };
    rCircle[i] = {x: r[i].x, y: r[i].y};
    v[i] = {x: 0, y: 0};
    c[i] = Math.random();
    for (let ii = 0; ii < n; ++ii) {
      let r = Math.random();
      matrix[i][ii] = (r < threshold1) + (r < threshold2);
    }
  }
  // Symmetricize
  for (let i = 0; i < n; ++i) {
    for (let ii = i; ii < n; ++ii) {
      let e = matrix[i][ii] + matrix[ii][i];
      matrix[i][ii] = e;
      matrix[ii][i] = e;
    }
  }
  // Find disconnected components and connect them
  let components = getComponents();
  for (let i = 1; i < components.length; ++i) {
    let a =
        Math.round(Math.random() * components[0].length) % components[0].length;
    let b =
        Math.round(Math.random() * components[i].length) % components[i].length;
    a = components[0][a];
    b = components[i][b];
    matrix[a][b] = 1;
    matrix[b][a] = matrix[a][b];
    for (let ii of components[i]) components[0].push(ii);
  }
  // matrix = [[0, 1, 1], [1, 0, 1], [1, 1, 0]];
  // r = [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: -0.06}];
  // v = [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}];
  // c = [0, 0, 0];
  updateTable();
  computeEigenvalue();
  draw();
  clearInterval(loop);
  draw();
  loop = setInterval(physics, interval);
}

function makeTree(depth) {
  depth = Math.max(0, Math.min(5, depth));
  let n = Math.pow(2, depth + 1) - 1;
  document.getElementById('size').value = n;
  matrix = [];
  r = [];
  rCircle = [];
  v = [];
  c = [];
  for (let i = 0; i < n; ++i) {
    matrix[i] = Array(n).fill(0);
    r[i] = {
      x: 0.8 * Math.cos(2 * Math.PI * i / n),
      y: 0.8 * Math.sin(2 * Math.PI * i / n)
    };
    rCircle[i] = {x: r[i].x, y: r[i].y};
    v[i] = {x: 0, y: 0};
    c[i] = Math.random();
  }
  for (let i = 0; i < n; ++i) {
    let ii = 2 * i + 1;
    if (ii < n) {
      matrix[i][ii] = 1;
      matrix[ii][i] = 1;
    }
    ii = 2 * i + 2;
    if (ii < n) {
      matrix[i][ii] = 1;
      matrix[ii][i] = 1;
    }
  }
  updateTable();
  computeEigenvalue();
  draw();
  clearInterval(loop);
  draw();
  loop = setInterval(physics, interval);
}

function toggleMode(button) {
  modeCircle = !button.checked;
}

function getComponents() {
  let n = matrix.length;
  let seen = [];
  let components = [];
  for (let i = 0; i < n; ++i) {
    if (seen.includes(i)) continue;
    let nodes = getConnected(i, [], n);
    for (let ii of nodes) seen.push(ii);
    components.push(nodes);
  }
  components.sort((a, b) => b.length - a.length);
  return components;
}

function getConnected(i, seen, n) {
  for (let ii = 0; ii < n; ++ii) {
    if (seen.includes(ii)) continue;
    if (i == ii)
      seen.push(ii);
    else if (matrix[i][ii] != 0) {
      seen.push(ii);
      getConnected(ii, seen, n);
    }
  }
  return seen;
}

function computeEigenvalue() {
  let n = matrix.length;
  for (let i = 0; i < n; ++i) {
    c[i] = 1.0 / n;
  }
  for (let iter = 0; iter < 500; ++iter) {
    let cLast = [];
    for (let i = 0; i < n; ++i) {
      cLast[i] = c[i]
      c[i] = 0;
    }

    for (let i = 0; i < n; ++i) {
      for (let ii = 0; ii < n; ++ii) {
        c[ii] += cLast[i] * matrix[i][ii];
      }
    }
    let s = 0;
    for (let i = 0; i < n; ++i) {
      s += c[i] * c[i];
    }
    if (s == 0)
      s = 1;
    else
      s = 1 / Math.sqrt(s);
    for (let i = 0; i < n; ++i) {
      c[i] *= s;
    }
    let err = 0;
    for (let i = 0; i < n; ++i) {
      err += Math.abs(c[i] - cLast[i]);
    }
    if (err < n * 1e-6) {
      console.log(`Took ${iter} iterations`);
      cMax = c[0];
      cMin = c[0];
      for (let i = 1; i < n; ++i) {
        cMax = Math.max(cMax, c[i]);
        cMin = Math.min(cMin, c[i]);
      }
      return;
    }
  }
  console.log(`Took maximum iterations`);
  cMax = c[0];
  cMin = c[0];
  for (let i = 1; i < n; ++i) {
    cMax = Math.max(cMax, c[i]);
    cMin = Math.min(cMin, c[i]);
  }
}

function updateTable() {
  let n = matrix.length;
  let table = document.getElementById('matrix');
  table.innerHTML = '';
  let thead = document.createElement('thead');
  table.insertAdjacentElement('beforeend', thead);
  thead.insertAdjacentElement('beforeend', document.createElement('th'));
  for (let i = 0; i < n; ++i) {
    let cell = document.createElement('th');
    cell.innerHTML = `${i + 1}`;
    thead.insertAdjacentElement('beforeend', cell);
  }
  for (let i = 0; i < n; ++i) {
    let row = document.createElement('tr');
    table.insertAdjacentElement('beforeend', row);
    let cell = document.createElement('td');
    cell.innerHTML = `${i + 1}`;
    row.insertAdjacentElement('beforeend', cell);
    for (let ii = 0; ii < n; ++ii) {
      let cell = document.createElement('td');
      cell.innerHTML = `${matrix[i][ii]}`;
      cell.addEventListener('mousedown', function(event) {
        incCell(i, ii, event);
      });
      row.insertAdjacentElement('beforeend', cell);
    }
  }
}

function incCell(i, ii, event) {
  let change = 1;
  if (event.ctrlKey) {
    change = -1
  }
  matrix[i][ii] = Math.max(0, Math.min(5, matrix[i][ii] + change));
  matrix[ii][i] = matrix[i][ii];
  let rows = document.querySelectorAll('tr');
  rows[i].children[ii + 1].innerHTML = `${matrix[i][ii]}`;
  rows[ii].children[i + 1].innerHTML = `${matrix[i][ii]}`;
  computeEigenvalue();
}

let resolution = 2000;
let radius = 0.015;
let r_ctx = radius * resolution;

function rToCtx(x) {
  return (x / 2 * (1 - radius * 6) + 0.5) * resolution;
}

function drawEdge(ctx, a, b, offset, n) {
  ctx.strokeStyle = 'white';
  ctx.beginPath();
  let ax = rToCtx(r[a].x);
  let ay = rToCtx(r[a].y);
  let bx = rToCtx(r[b].x);
  let by = rToCtx(r[b].y);
  if (modeCircle) {
    ax = rToCtx(rCircle[a].x);
    ay = rToCtx(rCircle[a].y);
    bx = rToCtx(rCircle[b].x);
    by = rToCtx(rCircle[b].y);
  }
  if (a == b) {
    let rNew = r_ctx * (offset / 2 + 1);
    let dx = r[a].x;
    let dy = r[a].y;
    if (modeCircle) {
      dx = rCircle[a].x;
      dy = rCircle[a].y;
    }
    let norm = Math.sqrt(dx * dx + dy * dy);
    dx = dx / norm;
    dy = dy / norm;
    ax += dx * rNew;
    ay += dy * rNew;
    ctx.arc(ax, ay, rNew, 0, 2 * Math.PI, false);
  } else {
    let arc = null;
    let dx = bx - ax;
    let dy = by - ay;
    let norm = Math.sqrt(dx * dx + dy * dy);
    if (norm == 0) return;
    for (let i = 0; i < n; ++i) {
      if (i == a || i == b) continue;
      let cx = rToCtx(r[i].x);
      let cy = rToCtx(r[i].y);
      if (modeCircle) {
        cx = rToCtx(rCircle[i].x);
        cy = rToCtx(rCircle[i].y);
      }
      let lineDistance = (dx * (ay - cy) - (ax - cx) * dy) / norm;
      if (Math.abs(lineDistance) > r_ctx * 1.25) continue;
      let aDistance =
          Math.sqrt(Math.pow((ax - cx), 2) + Math.pow((ay - cy), 2));
      if (aDistance > norm) continue;
      let bDistance =
          Math.sqrt(Math.pow((bx - cx), 2) + Math.pow((by - cy), 2));
      if (bDistance > norm) continue;
      let d = r_ctx * 1.25;
      if (Math.sign(lineDistance) == 1) d = -d;
      arc = {x: cx + dy / norm * d, y: cy - dx / norm * d};
      ctx.strokeStyle =
          tinycolor
              .fromRatio({h: 0, s: (1 - Math.abs(lineDistance) / r_ctx), v: 1})
              .toHexString();
      break;
    }
    dx = dx / norm;
    dy = dy / norm;
    offset = r_ctx * offset / 3;
    ax += dy * offset;
    ay -= dx * offset;
    bx += dy * offset;
    by -= dx * offset;
    if (arc == null) {
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    } else {
      arc.x += dy * offset;
      arc.y -= dx * offset;
      let points = [ax, ay, arc.x, arc.y, bx, by];
      let tension = 0.5;
      ctx.moveTo(ax, ay);
      ctx.curve(points, tension);
      // ctx.lineTo(arc.x, arc.y);
      // ctx.lineTo(bx, by);
    }
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
  ctx.save();
  ctx.lineWidth = r_ctx / 6;
  // Draw edges
  for (let i = 0; i < n; ++i) {
    for (let ii = i; ii < n; ++ii) {
      if (i == ii) {
        for (let k = 0; k < matrix[i][ii] / 2; ++k) drawEdge(ctx, i, ii, k, n);
      } else {
        let offset = (matrix[i][ii] - 1) / 2;
        for (let k = 0; k < matrix[i][ii]; ++k)
          drawEdge(ctx, i, ii, k - offset, n);
      }
    }
  }
  ctx.strokeStyle = 'white';

  // Draw vertices
  ctx.font = '40px Serif';
  for (let i = 0; i < n; ++i) {
    let x = rToCtx(r[i].x);
    let y = rToCtx(r[i].y);
    if (modeCircle) {
      x = rToCtx(rCircle[i].x);
      y = rToCtx(rCircle[i].y);
    }
    ctx.beginPath();
    ctx.arc(x, y, r_ctx, 0, 2 * Math.PI, false);
    let color = tinycolor.fromRatio(
        {h: (c[i] - cMin) / (cMax - cMin) * 0.5, s: 1.0, v: 0.6});
    ctx.fillStyle = color.toHexString();
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
  let kOut = 0.00002;
  let kIn = kOut * 1000;
  let kEdge = kOut * 10 * n;
  let bDamp = 0.1;

  for (let i = 0; i < n; ++i) {
    v[i].x += -kIn * r[i].x * Math.pow(c[i], 2);
    v[i].y += -kIn * r[i].y * Math.pow(c[i], 2);
  }

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
    r[i].x = Math.max(-1, Math.min(1, r[i].x));
    r[i].y = Math.max(-1, Math.min(1, r[i].y));
  }
  draw();
}


if (document.readyState == 'loading')
  window.addEventListener('DOMContentLoaded', updateSize);
else
  updateSize();