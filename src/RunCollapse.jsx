import { useEffect, useRef, useState } from 'react'
import './RunCollapse.css'

/**
 * Run & Collapse — React Canvas Runner
 * Mécaniques incluses:
 * 1) Destruction en vague (ripple) derrière le joueur
 * 2) Dash (Space) qui ralentit temporairement le scroll + impulse
 * 3) Rewind (R) ~2s via snapshots (coûte énergie + cooldown)
 * 4) Clone-écho (C) qui rejoue ta trajectoire récente (1.5s)
 * 5) Météo dynamique (Clair/Pluie/Vent/Brouillard) impact gameplay/visu
 */

export default function RunCollapse(){
  const canvasRef = useRef(null)
  const [hud, setHud] = useState({ energy:100, weather:'Clair', distance:0, info:'' })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })

    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // --------- STATE ----------
    const state = {
      baseSpeed: 240,
      scrollSpeed: 240,
      lastTime: 0,
      terrain: [],
      player: null,
      particles: [],
      distance: 0,
      energy: 100,
      maxEnergy: 100,
      weather: 'Clair',
      weatherTimer: 0,
      weatherDuration: 8,
      snapshots: [],
      snapshotMax: 120, // ~2s @60fps
      echo: null,
      clonePathBuffer: [],
      cloneCooldown: 0,
      dashCooldown: 0,
      rewindCooldown: 0,
      gameOver: false
    }

    // --------- UTILS ----------
    const rand = (a,b)=>Math.random()*(b-a)+a
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))

    // --------- TERRAIN ----------
    function createInitialTerrain(){
      state.terrain = []
      let x = -200
      for(let i=0;i<42;i++){
        const w = rand(180,420)
        const y = H*0.6 + Math.sin(i*0.6)*80 + rand(-40,40)
        state.terrain.push({ x, y, w, broken:false, alpha:1, id:i })
        x += w
      }
    }
    function pushTerrainSegment(){
      const last = state.terrain[state.terrain.length-1]
      const x = last ? last.x + last.w : W
      const w = rand(160,420)
      const y = H*0.6 + rand(-80,80)
      state.terrain.push({ x, y, w, broken:false, alpha:1, id:Date.now()+Math.random() })
    }

    // --------- PLAYER ----------
    function createPlayer(){
      state.player = {
        x: 220, y: H*0.5,
        w: 36, h: 48,
        vy: 0,
        grounded: false,
        speed: 180,
        facing: 1,
        lastDash: -10
      }
    }

    // --------- WEATHER ----------
    function changeWeather(){
      const arr = ['Clair','Pluie','Vent','Brouillard']
      state.weather = arr[Math.floor(Math.random()*arr.length)]
      state.weatherTimer = 0
      state.weatherDuration = rand(6,16)
      flash(`Météo: ${state.weather}`)
    }

    // --------- SNAPSHOTS (REWIND) ----------
    function pushSnapshot(){
      const snap = {
        player: {...state.player},
        terrain: state.terrain.map(s=>({...s})),
        distance: state.distance,
        scrollSpeed: state.scrollSpeed,
        energy: state.energy
      }
      state.snapshots.push(snap)
      if(state.snapshots.length>state.snapshotMax) state.snapshots.shift()
    }
    function rewindBurst(steps=14){
      if(state.snapshots.length<2) return
      for(let i=0;i<Math.min(steps, state.snapshots.length-1); i++){
        const prev = state.snapshots[state.snapshots.length-2]
        if(!prev) break
        state.player = {...prev.player}
        state.terrain = prev.terrain.map(s=>({...s}))
        state.distance = prev.distance
        state.scrollSpeed = prev.scrollSpeed
        state.energy = prev.energy
        state.snapshots.pop()
      }
    }

    // --------- ECHO CLONE ----------
    function startClone(replayPath){
      if(state.cloneCooldown>0 || !replayPath || replayPath.length<5) return
      state.echo = { path: replayPath.slice(), idx: 0 }
      state.cloneCooldown = 6
      flash('Clone lancé')
    }

    // --------- PARTICLES ----------
    function spawnParticles(x,y,color,count=12){
      for(let i=0;i<count;i++){
        state.particles.push({
          x,y,
          vx: rand(-120,120),
          vy: rand(-220,-20),
          life: rand(0.5,1.6),
          col: color,
          size: rand(2,6)
        })
      }
    }

    // --------- INPUT ----------
    const keys = {}
    const onKeyDown = (e)=>{ keys[e.key.toLowerCase()] = true; if(e.key===' ') e.preventDefault() }
    const onKeyUp =   (e)=>{ keys[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // --------- INIT ----------
    createInitialTerrain()
    createPlayer()
    changeWeather()

    // --------- MINI TOAST ----------
    let toastTimer = 0
    function flash(txt){
      setHud(h => ({...h, info: txt}))
      toastTimer = 2.2
    }

    // --------- UPDATE ----------
    function update(dt){
      if(state.gameOver) return

      // Weather progression
      state.weatherTimer += dt
      if(state.weatherTimer > state.weatherDuration) changeWeather()

      // Weather modifiers
      const weather = state.weather
      const weatherSpeedMod = (weather === 'Vent') ? 0.85 : 1.0
      const gravity = (weather === 'Pluie') ? 1750 : 1600
      const friction = (weather === 'Pluie') ? 0.92 : 1.0
      const effectiveScroll = state.scrollSpeed * weatherSpeedMod

      // Distance & energy
      state.distance += (effectiveScroll * dt) / 100
      state.energy = clamp(state.energy + 8*dt, 0, state.maxEnergy)

      // Player input
      const p = state.player
      if(keys['arrowleft'] || keys['q']) { p.x -= p.speed*dt; p.facing=-1 }
      if(keys['arrowright']|| keys['d']) { p.x += p.speed*dt; p.facing=1 }

      // Jump
      if((keys['z'] || keys['arrowup']) && p.grounded){
        p.vy = -520
        p.grounded = false
      }

      // Dash (Space) — ralentit la destruction + impulse
      if(keys[' '] && performance.now()/1000 - p.lastDash > 0.9 && state.energy >= 18 && state.dashCooldown<=0){
        p.lastDash = performance.now()/1000
        state.energy -= 18
        state.dashCooldown = 1.0
        p.x += 120
        const old = state.scrollSpeed
        state.scrollSpeed = state.baseSpeed * 0.6
        setTimeout(()=>{ state.scrollSpeed = old }, 700)
        flash('Dash !')
      }

      // Clone (C) — rejoue la trajectoire récente
      if(keys['c'] && state.clonePathBuffer.length>10 && state.cloneCooldown<=0){
        startClone(state.clonePathBuffer.slice())
        keys['c'] = false
      }

      // Rewind (R) — burst de rewind et cooldown
      if(keys['r'] && state.rewindCooldown<=0 && state.energy >= 22 && state.snapshots.length>5){
        state.energy -= 22
        state.rewindCooldown = 4
        rewindBurst(14)
        keys['r'] = false
        flash('Rewind')
      }

      // Physics
      p.vy += gravity * dt
      p.vy *= friction
      p.y += p.vy * dt

      // Ground check
      p.grounded = false
      for(const seg of state.terrain){
        if(seg.broken) continue
        if(p.x + p.w*0.5 > seg.x - 20 && p.x - p.w*0.5 < seg.x + seg.w + 20){
          const groundY = seg.y - p.h
          if(p.y >= groundY && p.y < groundY + 40 && p.vy >= -200){
            p.y = groundY
            p.vy = 0
            p.grounded = true
          }
        }
      }
      // screen bounds
      p.y = clamp(p.y, 20, H - p.h - 10)

      // Clone follow
      if(state.echo){
        const ep = state.echo
        if(ep.idx < ep.path.length){
          const step = ep.path[ep.idx++]
          ep.x = step.x; ep.y = step.y
        } else {
          state.echo = null
        }
      }

      // Scroll world
      for(const seg of state.terrain){
        if(!seg.broken){
          seg.x -= effectiveScroll * dt
          seg.y += Math.sin((seg.x+seg.id)*0.002)*0.4
        } else {
          seg.alpha -= dt * 0.6
        }
      }
      // recycle
      while(state.terrain.length && state.terrain[0].x + state.terrain[0].w < -500){
        state.terrain.shift()
        pushTerrainSegment()
      }

      // Destruction en vague
      for(const seg of state.terrain){
        if(seg.broken) continue
        if(seg.x + seg.w < p.x - 380){
          seg.broken = true
          spawnParticles(seg.x + seg.w*0.5, seg.y - 10, '#ffb86b', 18)
          // vague vers l'avant
          setTimeout(()=>{
            const idx = state.terrain.findIndex(s=>s.id===seg.id)
            if(idx!==-1){
              const next = state.terrain[idx+1]
              if(next && !next.broken && Math.random()>0.45){
                next.broken = true
                spawnParticles(next.x + next.w*0.5, next.y - 10, '#ff9b9b', 14)
              }
            }
          }, rand(180,700))
        }
      }

      // Particles
      for(let i=state.particles.length-1;i>=0;i--){
        const pa = state.particles[i]
        pa.vy += 1500*dt
        pa.x += pa.vx*dt
        pa.y += pa.vy*dt
        pa.life -= dt
        if(pa.life<=0) state.particles.splice(i,1)
      }

      // Record path for clone
      state.clonePathBuffer.push({x:p.x, y:p.y, t:performance.now()})
      if(state.clonePathBuffer.length>90) state.clonePathBuffer.shift()

      // Cooldowns
      state.dashCooldown = Math.max(0, state.dashCooldown - dt)
      state.cloneCooldown = Math.max(0, state.cloneCooldown - dt)
      state.rewindCooldown = Math.max(0, state.rewindCooldown - dt)

      // Snapshots for rewind
      pushSnapshot()

      // HUD
      setHud(h=>({
        ...h,
        energy: Math.round(state.energy),
        weather: state.weather,
        distance: Math.round(state.distance)
      }))

      // Death
      if(p.y > H + 80) state.gameOver = true

      // Toast timer
      if(toastTimer>0) toastTimer -= dt
      else if(hud.info) setHud(h=>({...h, info:''}))
    }

    // --------- DRAW ----------
    function draw(){
      // bg
      const grd = ctx.createLinearGradient(0,0,0,H)
      grd.addColorStop(0,'#071023')
      grd.addColorStop(1,'#081226')
      ctx.fillStyle = grd
      ctx.fillRect(0,0,W,H)

      // fogs
      if(state.weather === 'Brouillard'){
        ctx.fillStyle = 'rgba(6,18,30,0.35)'
        ctx.fillRect(0,0,W,H)
      }

      // terrain
      for(const seg of state.terrain){
        ctx.save()
        ctx.globalAlpha = seg.alpha ?? 1
        ctx.fillStyle = seg.broken ? '#4d3a3a' : '#1f6aa5'
        ctx.fillRect(seg.x, seg.y-6, seg.w, 6)
        ctx.fillStyle = seg.broken ? '#3d2f2f' : '#2fa1ff'
        ctx.fillRect(seg.x, seg.y-24, seg.w, 18)
        ctx.restore()
      }

      // rain
      if(state.weather === 'Pluie'){
        ctx.fillStyle = 'rgba(180,220,255,0.05)'
        ctx.fillRect(0,0,W,H)
        ctx.strokeStyle = 'rgba(180,220,255,0.07)'
        for(let i=0;i<60;i++){
          const rx = (i*47 + (performance.now()%500))%W
          ctx.beginPath()
          ctx.moveTo(rx, (i*33)%H)
          ctx.lineTo(rx+6, ((i*33)%H)+18)
          ctx.stroke()
        }
      }

      // player
      const p = state.player
      ctx.save()
      ctx.translate(p.x, p.y)
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath(); ctx.ellipse(0, p.h - 6, p.w*0.6, 8, 0, 0, Math.PI*2); ctx.fill()
      // body
      ctx.fillStyle = '#ffe6a7'
      ctx.fillRect(-p.w/2, -p.h, p.w, p.h)
      // eye
      ctx.fillStyle = '#000'
      ctx.fillRect(4, -p.h + 12, 6, 6)
      ctx.restore()

      // echo clone
      if(state.echo && state.echo.x && state.echo.y){
        ctx.save()
        ctx.globalAlpha = 0.55
        ctx.fillStyle = '#a6ffc9'
        ctx.fillRect(state.echo.x - 12, state.echo.y - 32, 24, 32)
        ctx.restore()
      }

      // particles
      for(const pa of state.particles){
        ctx.fillStyle = pa.col
        ctx.globalAlpha = clamp(pa.life,0,1)
        ctx.fillRect(pa.x, pa.y, pa.size, pa.size)
      }
      ctx.globalAlpha = 1
    }

    // --------- LOOP ----------
    function loop(ts){
      if(!state.lastTime) state.lastTime = ts
      const dt = Math.min(0.05, (ts - state.lastTime)/1000)
      state.lastTime = ts
      update(dt)
      draw()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)

    // --------- RESTART ----------
    const onKeyRestart = (e)=>{
      if(e.key.toLowerCase()==='r' && state.gameOver){
        state.gameOver = false
        state.distance = 0
        state.energy = state.maxEnergy
        state.terrain = []
        createInitialTerrain()
        createPlayer()
        state.snapshots = []
        flash('Recommencer')
      }
    }
    window.addEventListener('keydown', onKeyRestart)

    // --------- CLEANUP ----------
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onKeyRestart)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="wrapper">
      <div className="ui">
        <div className="title">Run &amp; Collapse</div>
        <div className="status">
          <span>Énergie: {hud.energy}</span>
          <span>Météo: {hud.weather}</span>
          <span>Distance: {hud.distance} m</span>
        </div>
        <div className="controls">←→ se déplacer — Z/↑ sauter — Space dash — C clone — R rewind</div>
        <div className="badges">Destruction en vague • Météo dynamique • Rewind • Clone • Dash</div>
      </div>

      {hud.info && <div className="toast">{hud.info}</div>}

      <canvas ref={canvasRef} className="canvas" />
    </div>
  )
}
