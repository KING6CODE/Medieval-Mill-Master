import { useEffect, useRef, useState } from "react";
import styles from "./RunGame.module.css";

export default function RunGame() {
  const canvasRef = useRef(null);
  const [energy, setEnergy] = useState(100);
  const [weather, setWeather] = useState("Clair");
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });

    // --- Game state ---
    const state = {
      scrollSpeed: 220,
      baseSpeed: 220,
      lastTime: 0,
      terrain: [],
      player: null,
      particles: [],
      distance: 0,
      energy: 100,
      maxEnergy: 100,
      weather: "Clair",
      weatherTimer: 0,
      weatherDuration: 8,
      snapshots: [],
      snapshotMax: 120,
      echo: null,
      clonePathBuffer: [],
      cloneCooldown: 0,
      dashCooldown: 0,
      rewindCooldown: 0,
      gameOver: false,
    };

    const rand = (min, max) => Math.random() * (max - min) + min;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function createInitialTerrain() {
      state.terrain = [];
      let x = -200;
      for (let i = 0; i < 40; i++) {
        const w = rand(180, 420);
        const y = H * 0.6 + Math.sin(i * 0.6) * 80 + rand(-40, 40);
        state.terrain.push({
          x,
          y,
          w,
          broken: false,
          alpha: 1,
          id: i,
        });
        x += w;
      }
    }
    function pushTerrainSegment() {
      const last = state.terrain[state.terrain.length - 1];
      const x = last ? last.x + last.w : W;
      const w = rand(160, 420);
      const y = H * 0.6 + rand(-80, 80);
      state.terrain.push({
        x,
        y,
        w,
        broken: false,
        alpha: 1,
        id: Date.now() + Math.random(),
      });
    }

    function createPlayer() {
      state.player = {
        x: 200,
        y: H * 0.5,
        w: 36,
        h: 48,
        vy: 0,
        grounded: false,
        speed: 180,
        facing: 1,
        lastDash: -10,
      };
    }

    function changeWeather() {
      const arr = ["Clair", "Pluie", "Vent", "Brouillard"];
      state.weather = arr[Math.floor(Math.random() * arr.length)];
      state.weatherTimer = 0;
      state.weatherDuration = rand(6, 16);
    }

    function pushSnapshot() {
      const snap = {
        player: { ...state.player },
        terrain: state.terrain.map((s) => ({ ...s })),
        distance: state.distance,
        scrollSpeed: state.scrollSpeed,
        energy: state.energy,
      };
      state.snapshots.push(snap);
      if (state.snapshots.length > state.snapshotMax) state.snapshots.shift();
    }

    function rewindStep() {
      if (state.snapshots.length < 2) return;
      const prev = state.snapshots[state.snapshots.length - 2];
      if (!prev) return;
      state.player = { ...prev.player };
      state.terrain = prev.terrain.map((s) => ({ ...s }));
      state.distance = prev.distance;
      state.scrollSpeed = prev.scrollSpeed;
      state.energy = prev.energy;
      state.snapshots.pop();
    }

    function spawnParticles(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        state.particles.push({
          x,
          y,
          vx: rand(-120, 120),
          vy: rand(-220, -20),
          life: rand(0.5, 1.6),
          col: color,
          size: rand(2, 6),
        });
      }
    }

    const keys = {};
    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === " ") e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    createInitialTerrain();
    createPlayer();
    changeWeather();

    function update(dt) {
      if (state.gameOver) return;
      state.weatherTimer += dt;
      if (state.weatherTimer > state.weatherDuration) changeWeather();

      const weatherSpeedMod = state.weather === "Vent" ? 0.85 : 1.0;
      const effectiveScroll = state.scrollSpeed * weatherSpeedMod;
      state.distance += (effectiveScroll * dt) / 100;
      state.energy = clamp(state.energy + 8 * dt, 0, state.maxEnergy);

      const p = state.player;
      if (keys["arrowleft"] || keys["q"]) p.x -= p.speed * dt;
      if (keys["arrowright"] || keys["d"]) p.x += p.speed * dt;

      if ((keys["z"] || keys["arrowup"]) && p.grounded) {
        p.vy = -520;
        p.grounded = false;
      }
      if (keys[" "]) {
        if (
          performance.now() / 1000 - p.lastDash > 0.9 &&
          state.energy >= 18 &&
          state.dashCooldown <= 0
        ) {
          p.lastDash = performance.now() / 1000;
          state.energy -= 18;
          state.dashCooldown = 1.0;
          p.x += 120;
          state.scrollSpeed = state.baseSpeed * 0.6;
          setTimeout(() => {
            state.scrollSpeed = state.baseSpeed;
          }, 700);
        }
      }
      if (keys["r"] && state.energy >= 22 && state.snapshots.length > 5) {
        state.energy -= 22;
        for (
          let i = 0;
          i < Math.min(14, state.snapshots.length - 1);
          i++
        )
          rewindStep();
        keys["r"] = false;
      }

      p.vy += 1600 * dt;
      p.y += p.vy * dt;
      p.grounded = false;
      for (let seg of state.terrain) {
        if (seg.broken) continue;
        if (
          p.x + p.w * 0.5 > seg.x - 20 &&
          p.x - p.w * 0.5 < seg.x + seg.w + 20
        ) {
          const groundY = seg.y - p.h;
          if (
            p.y >= groundY &&
            p.y < groundY + 40 &&
            p.vy >= -200
          ) {
            p.y = groundY;
            p.vy = 0;
            p.grounded = true;
          }
        }
      }
      p.y = clamp(p.y, 20, H - p.h - 10);

      for (let seg of state.terrain) seg.x -= effectiveScroll * dt;
      while (
        state.terrain.length &&
        state.terrain[0].x + state.terrain[0].w < -500
      ) {
        state.terrain.shift();
        pushTerrainSegment();
      }
      for (let seg of state.terrain) {
        if (seg.broken) continue;
        if (seg.x + seg.w < p.x - 380) {
          seg.broken = true;
          spawnParticles(
            seg.x + seg.w * 0.5,
            seg.y - 10,
            "#ffb86b",
            18
          );
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pa = state.particles[i];
        pa.vy += 1500 * dt;
        pa.x += pa.vx * dt;
        pa.y += pa.vy * dt;
        pa.life -= dt;
        if (pa.life <= 0) state.particles.splice(i, 1);
      }

      pushSnapshot();
      setEnergy(Math.round(state.energy));
      setWeather(state.weather);
      setDistance(Math.round(state.distance));

      if (p.y > H + 80) state.gameOver = true;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, "#071023");
      grd.addColorStop(1, "#081226");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      for (let seg of state.terrain) {
        ctx.save();
        ctx.globalAlpha = seg.alpha ?? 1;
        ctx.fillStyle = seg.broken ? "#4d3a3a" : "#2fa1ff";
        ctx.fillRect(seg.x, seg.y - 6, seg.w, 6);
        ctx.restore();
      }

      const p = state.player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = "#ffe6a7";
      ctx.fillRect(-p.w / 2, -p.h, p.w, p.h);
      ctx.restore();

      for (let pa of state.particles) {
        ctx.fillStyle = pa.col;
        ctx.globalAlpha = clamp(pa.life, 0, 1);
        ctx.fillRect(pa.x, pa.y, pa.size, pa.size);
        ctx.globalAlpha = 1;
      }
    }

    function loop(ts) {
      if (!state.lastTime) state.lastTime = ts;
      const dt = Math.min(0.05, (ts - state.lastTime) / 1000);
      state.lastTime = ts;
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", () => {});
      window.removeEventListener("keyup", () => {});
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.ui}>
        <div className={styles.title}>Run & Collapse</div>
        <div className={styles.status}>
          <span>Énergie: {energy}</span>
          <span>Météo: {weather}</span>
          <span>Distance: {distance} m</span>
        </div>
        <div className={styles.controls}>
          ←→ se déplacer, Z/↑ sauter, Space dash, R rewind
        </div>
      </div>
      <canvas ref={canvasRef} className={styles.canvas}></canvas>
    </div>
  );
}
