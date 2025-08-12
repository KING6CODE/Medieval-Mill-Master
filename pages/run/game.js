// Run & Collapse - simple canvas runner with 5 mechanics
// Controls: Left/Right, Z or Up to jump, Space dash, C spawn echo, R rewind

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width = innerWidth;
let H = canvas.height = innerHeight;

window.addEventListener('resize', ()=>{ W=canvas.width=innerWidth; H=canvas.height=innerHeight; });

/* -----------------------
   Game parameters & state
   ----------------------- */
const state = {
  scrollSpeed: 220,        // pixels/sec world speed (base)
  baseSpeed: 220,
  lastTime: 0,
  terrain: [],             // platform segments
  obstacles: [],
  player: null,
  particles: [],
  distance: 0,
  energy: 100,
  maxEnergy: 100,
  weather: 'Clair',        // Clair, Pluie, Vent, Brouillard
  weatherTimer: 0,
  weatherDuration: 8,
  snapshots: [],           // for rewind buffer
  snapshotMax: 120,        // ~120 frames buffer (~2 sec at 60fps)
  echo: null,
  clonePathBuffer: [],     // path recording for echo
  cloneCooldown: 0,
  dashCooldown: 0,
  rewindCooldown: 0,
  gameOver: false
};

/* -----------------------
   Utilities
   ----------------------- */
function rand(min,max){ return Math.random()*(max-min)+min; }
function now(){ return performance.now()/1000; }
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

/* -----------------------
   Terrain generation
   ----------------------- */
function createInitialTerrain(){
  state.terrain = [];
  let x = -200;
  for(let i=0;i<40;i++){
    const w = rand(180,420);
    const y = H*0.6 + Math.sin(i*0.6)*80 + rand(-40,40);
    state.terrain.push({x,y,w,broken:false,alpha:1, id:i});
    x += w;
  }
}
function pushTerrainSegment(){
  const last = state.terrain[state.terrain.length-1];
  const x = last ? last.x + last.w : W;
  const w = rand(160,420);
  const y = H*0.6 + rand(-80,80);
  state.terrain.push({x,y,w,broken:false,alpha:1, id:Date.now()+Math.random()});
}

/* -----------------------
   Player
   ----------------------- */
function createPlayer(){
  const p = {
    x: 200,
    y: H*0.5,
    w: 36, h:48,
    vy:0,
    grounded:false,
    speed:180,
    dashMeter:100,
    facing:1,
    lastDash: -10,
    energyRegenTimer:0
  };
  state.player = p;
}

/* -----------------------
   Weather system
   ----------------------- */
function changeWeather(){
  const arr = ['Clair','Pluie','Vent','Brouillard'];
  state.weather = arr[Math.floor(Math.random()*arr.length)];
  state.weatherTimer = 0;
  state.weatherDuration = rand(6,16);
}

/* -----------------------
   Snapshot (for rewind)
   ----------------------- */
function pushSnapshot(){
  const snap = {
    t: performance.now(),
    player: {...state.player},
    terrain: state.terrain.map(s=>({x:s.x,y:s.y,w:s.w,broken:s.broken,alpha:s.alpha,id:s.id})),
    obstacles: state.obstacles.map(o=>({...o})),
    distance: state.distance,
    scrollSpeed: state.scrollSpeed,
    energy: state.energy
  };
  state.snapshots.push(snap);
  if(state.snapshots.length>state.snapshotMax) state.snapshots.shift();
}
function rewindStep(){
  if(state.snapshots.length<2) return;
  // Take last snapshot and pop it
  const last = state.snapshots.pop();
  const prev = state.snapshots[state.snapshots.length-1];
  if(!prev) return;
  // restore values
  state.player = {...prev.player};
  state.terrain = prev.terrain.map(s=>({...s}));
  state.obstacles = prev.obstacles.map(o=>({...o}));
  state.distance = prev.distance;
  state.scrollSpeed = prev.scrollSpeed;
  state.energy = prev.energy;
}

/* -----------------------
   Echo clone (replay recorded path)
   ----------------------- */
function startClone(replayPath){
  if(state.cloneCooldown>0 || !replayPath || replayPath.length<5) return;
  state.echo = {
    path: replayPath.slice(), // array of {x,y,t}
    t:0,
    idx:0,
    life:3
  };
  state.cloneCooldown = 6; // seconds
}

/* -----------------------
   Particles (for destruction)
   ----------------------- */
function spawnParticles(x,y,color,count=12){
  for(let i=0;i<count;i++){
    state.particles.push({
      x,y,
      vx: rand(-120,120),
      vy: rand(-220,-20),
      life: rand(0.5,1.6),
      col: color,
      size: rand(2,6)
    });
  }
}

/* -----------------------
   Input
   ----------------------- */
const keys = {};
window.addEventListener('keydown', e=>{
  keys[e.key.toLowerCase()] = true;
  if(e.key === ' '){ e.preventDefault(); } // prevent scroll
});
window.addEventListener('keyup', e=>{
  keys[e.key.toLowerCase()] = false;
});

/* -----------------------
   Init
   ----------------------- */
createInitialTerrain();
createPlayer();
changeWeather();

/* -----------------------
   Main Loop
   ----------------------- */
function update(dt){
  if(state.gameOver) return;
  // Weather timer
  state.weatherTimer += dt;
  if(state.weatherTimer > state.weatherDuration){
    changeWeather();
  }

  // Distance & speed warp
  const weatherSpeedMod = (state.weather === 'Vent') ? 0.85 : 1.0;
  const effectiveScroll = state.scrollSpeed * weatherSpeedMod;

  // Update distance
  state.distance += (effectiveScroll * dt) / 100;

  // Energy regen
  state.energy = clamp(state.energy + 8*dt, 0, state.maxEnergy);

  // handle input
  const p = state.player;
  // left/right simple control (player moves relative; but main progression is scroll)
  if(keys['arrowleft'] || keys['q']){ p.x -= p.speed*dt; p.facing=-1; }
  if(keys['arrowright'] || keys['d']){ p.x += p.speed*dt; p.facing=1; }
  // jump
  if((keys['z'] || keys['arrowup'] || keys[' ']) && p.grounded){
    if(keys[' ']) {
      // Space used for dash instead of jump if pressed quickly
      // We'll detect dash separately
    } else {
      p.vy = -520;
      p.grounded=false;
    }
  }
  // dash (Space)
  if(keys[' ']){
    if(performance.now()/1000 - p.lastDash > 0.9 && state.energy >= 18 && state.dashCooldown<=0){
      p.lastDash = performance.now()/1000;
      state.energy -= 18;
      state.dashCooldown = 1.0;
      // dash effect: quick forward impulse and slow destruction
      p.x += 120;
      state.scrollSpeed = state.baseSpeed * 0.6;
      setTimeout(()=>{ state.scrollSpeed = state.baseSpeed; }, 700);
    }
  }
  // clone (C)
  if(keys['c'] && state.clonePathBuffer.length>10 && state.cloneCooldown<=0){
    startClone(state.clonePathBuffer.slice());
    keys['c'] = false;
  }
  // rewind (R)
  if(keys['r'] && state.rewindCooldown<=0 && state.energy >= 22 && state.snapshots.length>5){
    // start rewind: consume energy and go back by popping snapshots for the duration R is pressed
    state.energy -= 22;
    state.rewindCooldown = 4;
    // We'll perform a few rewind steps immediately (fast rewind)
    for(let i=0;i<Math.min(14, state.snapshots.length-1); i++) rewindStep();
    keys['r'] = false;
  }

  // physics
  p.vy += 1600 * dt; // gravity
  p.y += p.vy * dt;

  // ground collision detection with nearest platform under player
  p.grounded = false;
  for(let seg of state.terrain){
    if(seg.broken) continue;
    // check if player is above the segment and close in x
    if(p.x + p.w*0.5 > seg.x - 20 && p.x - p.w*0.5 < seg.x + seg.w + 20){
      const groundY = seg.y - p.h;
      if(p.y >= groundY && p.y < groundY + 40 && p.vy >= -200){
        p.y = groundY;
        p.vy = 0;
        p.grounded = true;
      }
    }
  }

  // keep player visible vertical bounds
  p.y = clamp(p.y, 20, H - p.h - 10);

  // clone path recording (positions with timestamps)
  state.clonePathBuffer.push({x:p.x,y:p.y,t:performance.now()});
  if(state.clonePathBuffer.length > 90) state.clonePathBuffer.shift();

  // update echo clone if exists
  if(state.echo){
    // follow path by timestamp steps
    const ep = state.echo;
    if(ep.idx < ep.path.length){
      const step = ep.path[ep.idx];
      // spawn small indicator, clone can't die but can trigger objects in future
      ep.x = step.x; ep.y = step.y;
      ep.idx++;
    } else {
      // finish
      state.echo = null;
    }
  }

  // update terrain positions (scroll left)
  for(let seg of state.terrain){
    if(!seg.broken){
      seg.x -= effectiveScroll * dt;
      // slight vertical oscillation for life
      seg.y += Math.sin((seg.x+seg.id)*0.002)*0.4;
    } else {
      // broken segments fade
      seg.alpha -= dt * 0.6;
    }
  }

  // remove offscreen terrain
  while(state.terrain.length && state.terrain[0].x + state.terrain[0].w < -500){
    state.terrain.shift();
    // new segment appended to maintain continuous world
    pushTerrainSegment();
  }

  // Terrain destruction: any segment that goes a threshold behind player's x begins to break
  for(let seg of state.terrain){
    if(seg.broken) continue;
    const behindThreshold = p.x - 380;
    if(seg.x + seg.w < behindThreshold){
      // trigger ripple destroy with some chance and spawn particles
      seg.broken = true;
      spawnParticles(seg.x + seg.w*0.5, seg.y - 10, '#ffb86b', 18);
      // propagate ripple to next segment ahead after short delay
      setTimeout(()=>{
        const idx = state.terrain.findIndex(s=>s.id===seg.id);
        if(idx!==-1 && state.terrain[idx+1] && !state.terrain[idx+1].broken && Math.random()>0.4){
          state.terrain[idx+1].broken = true;
          spawnParticles(state.terrain[idx+1].x + state.terrain[idx+1].w*0.5, state.terrain[idx+1].y - 10, '#ff9b9b', 14);
        }
      }, rand(180,700));
    }
  }

  // particles physics
  for(let i = state.particles.length-1; i>=0; i--){
    const pa = state.particles[i];
    pa.vy += 1500 * dt;
    pa.x += pa.vx * dt;
    pa.y += pa.vy * dt;
    pa.life -= dt;
    if(pa.life <= 0) state.particles.splice(i,1);
  }

  // distances and UI cooldowns
  state.dashCooldown = Math.max(0, state.dashCooldown - dt);
  state.cloneCooldown = Math.max(0, state.cloneCooldown - dt);
  state.rewindCooldown = Math.max(0, state.rewindCooldown - dt);

  // snapshots for rewind
  pushSnapshot();

  // End condition: if player falls below screen or too many broken sequential platforms under player
  if(p.y > H + 80) {
    state.gameOver = true;
  } else {
    // if the segment under player's feet is broken -> risk: if many consecutive broken -> die
    const under = state.terrain.find(s => p.x > s.x && p.x < s.x + s.w);
    if(under && under.broken && !p.grounded){
      // falling hazard increases: allow short time
      // nothing extra here; player can die by falling
    }
  }
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // background gradient with parallax
  const grd = ctx.createLinearGradient(0,0,0,H);
  grd.addColorStop(0,'#071023');
  grd.addColorStop(1,'#081226');
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,W,H);

  // fog if weather
  if(state.weather === 'Brouillard'){
    ctx.fillStyle = 'rgba(6,18,30,0.35)';
    ctx.fillRect(0,0,W,H);
  }

  // draw terrain
  for(let seg of state.terrain){
    const x = seg.x, y = seg.y, w = seg.w;
    ctx.save();
    ctx.globalAlpha = seg.alpha ?? 1;
    // platform base
    ctx.fillStyle = seg.broken ? '#4d3a3a' : '#1f6aa5';
    ctx.fillRect(x, y-6, w, 6);
    // top
    ctx.fillStyle = seg.broken ? '#3d2f2f' : '#2fa1ff';
    ctx.fillRect(x, y-24, w, 18);
    ctx.restore();
  }

  // draw obstacles (simple spikes)
  for(let obs of state.obstacles){
    // (not used much here)
  }

  // draw player
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#fff';
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, p.h - 6, p.w*0.6, 8, 0, 0, Math.PI*2); ctx.fill();
  // body
  ctx.fillStyle = '#ffe6a7';
  ctx.fillRect(-p.w/2, -p.h, p.w, p.h);
  // eye
  ctx.fillStyle = '#000';
  ctx.fillRect(4, -p.h + 12, 6, 6);
  ctx.restore();

  // draw echo clone
  if(state.echo){
    const ep = state.echo;
    if(ep.x && ep.y){
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#a6ffc9';
      ctx.fillRect(ep.x - 12, ep.y - 32, 24, 32);
      ctx.restore();
    }
  }

  // particles
  for(let pa of state.particles){
    ctx.fillStyle = pa.col;
    ctx.globalAlpha = clamp(pa.life, 0, 1);
    ctx.fillRect(pa.x, pa.y, pa.size, pa.size);
    ctx.globalAlpha = 1;
  }

  // small HUD overlays
  // foggy overlay if rain
  if(state.weather === 'Pluie'){
    ctx.fillStyle = 'rgba(180,220,255,0.05)';
    ctx.fillRect(0,0,W,H);
    // rain streaks
    for(let i=0;i<60;i++){
      const rx = (i*47 + (performance.now()%500))/1.0 % W;
      ctx.strokeStyle = 'rgba(180,220,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(rx, (i*33)%H);
      ctx.lineTo(rx+6, (i*33)%H + 18);
      ctx.stroke();
    }
  }

  // fog overlay for brouillard
  if(state.weather === 'Brouillard'){
    ctx.fillStyle = 'rgba(12,20,30,0.18)';
    ctx.fillRect(0,0,W,H);
  }

  // UI elements rendered in DOM will reflect values; update them now:
  document.getElementById('energy').innerText = `Énergie: ${Math.round(state.energy)}`;
  document.getElementById('weather').innerText = `Météo: ${state.weather}`;
  document.getElementById('distance').innerText = `Distance: ${Math.round(state.distance)} m`;

  // Game over overlay
  if(state.gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '48px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W/2, H/2 - 20);
    ctx.font = '18px system-ui';
    ctx.fillText('Appuie sur R pour réessayer', W/2, H/2 + 18);
  }
}

function loop(ts){
  if(!state.lastTime) state.lastTime = ts;
  const dt = Math.min(0.05, (ts - state.lastTime)/1000);
  state.lastTime = ts;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

/* -----------------------
   Basic interaction: restart on R when game over
   ----------------------- */
window.addEventListener('keydown', e=>{
  if(e.key.toLowerCase() === 'r' && state.gameOver){
    // reset basic state
    state.gameOver = false;
    state.distance = 0;
    state.energy = state.maxEnergy;
    state.terrain = [];
    createInitialTerrain();
    createPlayer();
    state.snapshots = [];
  }
});
