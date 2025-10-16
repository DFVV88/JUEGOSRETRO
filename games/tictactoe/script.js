const cells = Array.from(document.querySelectorAll('.cell'));
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const levelSel = document.getElementById('level');
let board = Array(9).fill(null); // 'X' | 'O' | null
let turn = 'X'; // player always X
const lines = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

cells.forEach(c=>c.addEventListener('click', ()=>play(c)));
resetBtn.addEventListener('click', reset);

function play(cell){
  const i = +cell.dataset.i;
  if(board[i] || winner(board) || turn !== 'X') return;
  move(i,'X');
  if(winner(board) || full(board)) return endCheck();
  // AI move
  setTimeout(()=>{
    const j = aiMove(levelSel.value);
    move(j,'O');
    endCheck();
  }, 260);
}

function move(i,mark){
  board[i] = mark;
  cells[i].textContent = mark;
  cells[i].classList.add(mark.toLowerCase());
  turn = mark === 'X' ? 'O' : 'X';
  statusEl.textContent = turn === 'X' ? 'Tu turno (X)' : 'Turno de la IA (O)';
}

function endCheck(){
  const w = winner(board);
  if(w){
    statusEl.textContent = w === 'X' ? '¡Ganaste! 🎉' : 'La IA te ganó 😈';
    turn = '-';
    return true;
  }
  if(full(board)){
    statusEl.textContent = 'Empate 🤝';
    turn = '-';
    return true;
  }
  return false;
}

function winner(b){
  for(const [a,c,d] of lines){
    if(b[a] && b[a]===b[c] && b[a]===b[d]) return b[a];
  }
  return null;
}
function full(b){ return b.every(x=>x); }

function aiMove(level){
  // smart: win if can, else block if player can win, else center, corner, random
  const empty = board.map((v,i)=>v?null:i).filter(i=>i!==null);
  // try win
  for(const i of empty){ board[i]='O'; if(winner(board)==='O'){ board[i]=null; return i;} board[i]=null; }
  // try block
  for(const i of empty){ board[i]='X'; if(winner(board)==='X'){ board[i]=null; return i;} board[i]=null; }
  // easy: random
  if(level==='easy'){ return empty[Math.floor(Math.random()*empty.length)]; }
  // center
  if(empty.includes(4)) return 4;
  // corners
  const corners = [0,2,6,8].filter(i=>empty.includes(i));
  if(corners.length) return corners[Math.floor(Math.random()*corners.length)];
  // any
  return empty[0];
}

function reset(){
  board = Array(9).fill(null);
  turn = 'X';
  cells.forEach(c=>{ c.textContent=''; c.classList.remove('x','o'); });
  statusEl.textContent = 'Tu turno (X)';
}
