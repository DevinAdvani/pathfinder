const gridElement = document.getElementById('grid');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const algorithmSelect = document.getElementById('algorithm');

const ROWS = 20;
const COLS = 20;

let grid = [];
let startCell = {row: 0, col: 0};
let endCell = {row: ROWS - 1, col: COLS - 1};

// Initialize grid
function createGrid() {
  gridElement.innerHTML = '';
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (r === startCell.row && c === startCell.col) cell.classList.add('start');
      if (r === endCell.row && c === endCell.col) cell.classList.add('end');
      cell.addEventListener('click', () => toggleWall(r, c));
      gridElement.appendChild(cell);
      row.push(cell);
    }
    grid.push(row);
  }
}

function toggleWall(r, c) {
  const cell = grid[r][c];
  if (cell.classList.contains('start') || cell.classList.contains('end')) return;
  cell.classList.toggle('wall');
}

// Pathfinding functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function visualizePath(path) {
  for (const {row, col} of path) {
    const cell = grid[row][col];
    if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
      cell.classList.add('path');
      await sleep(50);
    }
  }
}

async function visualizeVisited(visited) {
  for (const {row, col} of visited) {
    const cell = grid[row][col];
    if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
      cell.classList.add('visited');
      await sleep(20);
    }
  }
}

// Simple Dijkstra / A* pathfinding
function getNeighbors(node) {
  const {row, col} = node;
  const neighbors = [];
  const directions = [
    [0, 1],[1, 0],[0, -1],[-1, 0]
  ];
  for (const [dr, dc] of directions) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !grid[r][c].classList.contains('wall')) {
      neighbors.push({row: r, col: c});
    }
  }
  return neighbors;
}

function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

async function dijkstra(start, end) {
  const visited = [];
  const prev = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  const dist = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));
  dist[start.row][start.col] = 0;
  const pq = [{...start, cost: 0}];

  while (pq.length) {
    pq.sort((a,b) => a.cost - b.cost);
    const current = pq.shift();
    visited.push(current);
    if (current.row === end.row && current.col === end.col) break;

    for (const neighbor of getNeighbors(current)) {
      const alt = dist[current.row][current.col] + 1;
      if (alt < dist[neighbor.row][neighbor.col]) {
        dist[neighbor.row][neighbor.col] = alt;
        prev[neighbor.row][neighbor.col] = current;
        pq.push({...neighbor, cost: alt});
      }
    }
  }

  await visualizeVisited(visited);

  const path = [];
  let current = end;
  while (current && prev[current.row][current.col] !== null) {
    path.push(current);
    current = prev[current.row][current.col];
  }
  path.push(start);
  path.reverse();
  await visualizePath(path);
}

async function astar(start, end) {
  const visited = [];
  const prev = Array.from({length: ROWS}, () => Array(COLS).fill(null));
  const gScore = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));
  const fScore = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));

  gScore[start.row][start.col] = 0;
  fScore[start.row][start.col] = heuristic(start, end);

  const openSet = [{...start, f: fScore[start.row][start.col]}];

  while (openSet.length) {
    openSet.sort((a,b) => a.f - b.f);
    const current = openSet.shift();
    visited.push(current);

    if (current.row === end.row && current.col === end.col) break;

    for (const neighbor of getNeighbors(current)) {
      const tentativeG = gScore[current.row][current.col] + 1;
      if (tentativeG < gScore[neighbor.row][neighbor.col]) {
        prev[neighbor.row][neighbor.col] = current;
        gScore[neighbor.row][neighbor.col] = tentativeG;
        fScore[neighbor.row][neighbor.col] = tentativeG + heuristic(neighbor, end);
        if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
          openSet.push({...neighbor, f: fScore[neighbor.row][neighbor.col]});
        }
      }
    }
  }

  await visualizeVisited(visited);

  const path = [];
  let current = end;
  while (current && prev[current.row][current.col] !== null) {
    path.push(current);
    current = prev[current.row][current.col];
  }
  path.push(start);
  path.reverse();
  await visualizePath(path);
}

// Event listeners
startBtn.addEventListener('click', () => {
  grid.flat().forEach(c => c.classList.remove('visited','path'));
  const algo = algorithmSelect.value;
  if (algo === 'dijkstra') dijkstra(startCell, endCell);
  else astar(startCell, endCell);
});

resetBtn.addEventListener('click', createGrid);

createGrid();
