const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const speedSel = document.getElementById('speed');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');

const size = 24; // grid cell size
const cols = Math.floor(cvs.width / size);
const rows = Math.floor(cvs.height / size);

let snake, dir, food, loop, speed = +speedSel.value, running=false, score=0, best=+localStorage.getItem('snake_best'||0);

bestEl.textContent = localStorage.getItem('snake_best') || 0;

function init(){
  snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
  dir = {x:1, y:0};
  placeFood();
  score = 0;
  updateHUD();
  draw();
}
function start(){
  if(running) return;
  running = true;
  loop = setInterval(tick, speed);
}
function pause(){
  running = false;
  clearInterval(loop);
}
function reset(){
  pause();
  init();
}
function setSpeed(ms){
  speed = +ms;
  if(running){ pause(); start(); }
}
speedSel.addEventListener('change', e=> setSpeed(e.target.value));
startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);

function tick(){
  // new head
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  // wall wrap (optional): comment out to enable game over on walls
  // head.x = (head.x + cols) % cols;
  // head.y = (head.y + rows) % rows;

  // collisions
  if(head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || hitsSelf(head)){
    gameOver();
    return;
  }
  snake.unshift(head);

  // eat
  if(head.x === food.x && head.y === food.y){
    score += 10;
    if(score > (localStorage.getItem('snake_best')|0)){
      localStorage.setItem('snake_best', score);
      bestEl.textContent = score;
    }
    placeFood();
  } else {
    snake.pop();
  }

  draw();
  updateHUD();
}

function hitsSelf(h){
  return snake.some((s,i)=> i>0 && s.x===h.x && s.y===h.y);
}

function draw(){
  // background grid
  ctx.fillStyle = '#0a111b';
  ctx.fillRect(0,0,cvs.width,cvs.height);
  for(let x=0;x<cols;x++){
    for(let y=0;y<rows;y++){
      if((x+y)%2===0){
        ctx.fillStyle = '#0c1420';
        ctx.fillRect(x*size,y*size,size,size);
      }
    }
  }
  // food
  ctx.fillStyle = '#ff3d81';
  ctx.fillRect(food.x*size+4, food.y*size+4, size-8, size-8);
  // snake
  for(let i=0;i<snake.length;i++){
    ctx.fillStyle = i===0 ? '#00e0ff' : '#35b6ff';
    ctx.fillRect(snake[i].x*size+2, snake[i].y*size+2, size-4, size-4);
  }
}

function placeFood(){
  do{
    food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
  } while(snake.some(s=>s.x===food.x && s.y===food.y));
}

function updateHUD(){
  scoreEl.textContent = score;
  bestEl.textContent = localStorage.getItem('snake_best') || 0;
}

// Input
window.addEventListener('keydown', e=>{
  const k = e.key;
  if(k==='ArrowUp' || k==='w'){ if(dir.y===0){ dir={x:0,y:-1}; } }
  else if(k==='ArrowDown' || k==='s'){ if(dir.y===0){ dir={x:0,y:1}; } }
  else if(k==='ArrowLeft' || k==='a'){ if(dir.x===0){ dir={x:-1,y:0}; } }
  else if(k==='ArrowRight' || k==='d'){ if(dir.x===0){ dir={x:1,y:0}; } }
});

document.querySelectorAll('.mobile [data-k]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const k = b.dataset.k;
    const e = new KeyboardEvent('keydown', {key:k});
    window.dispatchEvent(e);
  });
});

function gameOver(){
  pause();
  const again = confirm('Game Over. Puntaje: '+score+'\n¿Reiniciar?');
  if(again){ reset(); start(); }
}

init();
