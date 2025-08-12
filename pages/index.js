// pages/index.js
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SAVE_KEY = "mm_save_v1";
const TECH_KEY = "mm_tech_v1";

function fmt(n) {
  if (n >= 1e6) return `${Math.round(n/1e5)/10}M`;
  if (n >= 1e3) return `${Math.round(n/100)/10}k`;
  return Math.floor(n);
}

function WeatherArt({ weather }) {
  // minimal visual for weather (sun/clouds/rain/cracks)
  return (
    <div className={`weather-art ${weather.toLowerCase()}`}>
      <svg viewBox="0 0 200 80" className="sky" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g0" x1="0" x2="1"><stop offset="0" stopColor="#0b1b33"/><stop offset="1" stopColor="#071027"/></linearGradient>
        </defs>
        <rect width="200" height="80" fill="url(#g0)" />
      </svg>
      <div className="sun" />
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="rain">
        {Array.from({length:14}).map((_,i)=>(<span key={i} style={{left:`${i*7}%`, animationDelay:`${i*80}ms`}} className="drop"/>))}
      </div>
      <div className="cracks"/>
      <style jsx>{`
        .weather-art { position:absolute; inset:0; pointer-events:none; z-index:0; opacity:0.95; }
        .sun { position:absolute; right:6%; top:8%; width:90px; height:90px; border-radius:50%; background: radial-gradient(circle at 30% 30%, #fff8b7, #ffc857); box-shadow:0 10px 40px rgba(255,180,60,0.12); transition:opacity .5s;}
        .cloud { position:absolute; background: rgba(255,255,255,0.06); border-radius:40px; box-shadow: inset 0 -10px 30px rgba(0,0,0,0.3); }
        .c1 { width:220px; height:56px; left:6%; top:8%; }
        .c2 { width:280px; height:72px; left:40%; top:22%; opacity:0.9; transform:scale(0.95); }
        .rain { position:absolute; inset:0; opacity:0; }
        .drop { position:absolute; top:14%; width:2px; height:22px; background: linear-gradient(#fff,#bfe0ff); border-radius:2px; transform: translateY(-6vh); animation:fall .9s linear infinite; }
        @keyframes fall { 0%{ transform:translateY(-8vh); opacity:0 } 10%{opacity:1} 100%{ transform:translateY(90vh); opacity:0 } }
        .cracks { position:absolute; bottom:6%; left:6%; right:6%; height:20%; opacity:0; }
        .weather-art.soleil .sun { opacity:1; transform:translateY(0); }
        .weather-art.soleil .rain { opacity:0; }
        .weather-art.pluie .sun { opacity:.35; transform:translateY(-6px) scale(.95); }
        .weather-art.pluie .rain { opacity:1; }
        .weather-art.sécheresse .sun { opacity:.95; transform:translateY(-3px) }
        .weather-art.sécheresse .rain { opacity:0; }
        .weather-art.sécheresse .cracks { opacity:1; background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)); }
      `}</style>
    </div>
  );
}

export default function Home() {
  // core resources
  const [wheat, setWheat] = useState(240);
  const [flour, setFlour] = useState(0);
  const [bread, setBread] = useState(0);
  const [money, setMoney] = useState(200);

  // mechanics
  const [cycleMs, setCycleMs] = useState(6000);
  const [workers, setWorkers] = useState(1);
  const [morale, setMorale] = useState(92);
  const [weather, setWeather] = useState("Soleil");

  // UI / notif
  const [notif, setNotif] = useState("Bienvenue au moulin !");
  const [history, setHistory] = useState([]);

  // tech
  const [unlockedTechs, setUnlockedTechs] = useState({}); // read from localStorage

  // refs
  const runningRef = useRef(false);
  const autoRef = useRef(null);

  // weather multipliers
  const weatherMultipliers = { Soleil: 1.0, Pluie: 0.85, Sécheresse: 0.5 };

  // On mount: load game & techs
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (s) {
        setWheat(s.wheat ?? 240);
        setFlour(s.flour ?? 0);
        setBread(s.bread ?? 0);
        setMoney(s.money ?? 200);
        setCycleMs(s.cycleMs ?? 6000);
        setWorkers(s.workers ?? 1);
        setMorale(s.morale ?? 92);
        pushHist("Partie chargée depuis la sauvegarde.");
      } else {
        pushHist("Nouvelle partie. Bonne chance !");
      }
    } catch (e) {
      console.error(e);
      pushHist("Erreur lors du chargement.");
    }
    try {
      const t = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
      setUnlockedTechs(t);
    } catch (e) {
      setUnlockedTechs({});
    }
  }, []);

  // apply tech effects when unlockedTechs changes
  useEffect(() => {
    // compute cycleMs multiplier or modifiers based on techs
    let base = 6000;
    if (unlockedTechs["wheel_stone"]) base *= 0.98; // tiny
    if (unlockedTechs["water_mill"]) base *= 0.75;
    if (unlockedTechs["wind_mill"]) base *= 0.6;
    if (unlockedTechs["steam_engine"]) base *= 0.45;
    if (unlockedTechs["electric_motors"]) base *= 0.32;
    if (unlockedTechs["ai_automation"]) base *= 0.18;
    // clamp to minimum
    setCycleMs(Math.max(800, Math.round(base)));
  }, [unlockedTechs]);

  // auto weather change
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.random();
      if (r < 0.6) setWeather("Soleil");
      else if (r < 0.9) setWeather("Pluie");
      else setWeather("Sécheresse");
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // production loop
  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      runCycle();
    }, cycleMs);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleMs, workers, weather, unlockedTechs, morale]);

  function pushHist(msg) {
    const stamp = `${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — ${msg}`;
    setNotif(msg);
    setHistory(h => [stamp, ...h].slice(0,40));
  }

  function runCycle() {
    // consume wheat according to workers
    const consume = Math.max(1, workers);
    if (wheat <= 0) {
      pushHist("Plus de blé ! Achète ou cultive du blé.");
      return;
    }
    const actuallyConsume = Math.min(wheat, consume);
    setWheat(w => Math.max(0, w - actuallyConsume));

    // produce flour
    const base = actuallyConsume * (unlockedTechs["hand_tools"] ? 1.1 : 1.0) * (unlockedTechs["wheel_stone"] ? 1.05 : 1.0);
    const moraleBonus = 1 + (Math.min(100, Math.max(0, morale))/1000);
    const produced = +(base * weatherMultipliers[weather] * moraleBonus).toFixed(2);
    setFlour(f => +(f + produced).toFixed(2));

    // convert flour -> bread (auto)
    setFlour(f => {
      const total = +(f + produced).toFixed(2);
      const possibleBread = Math.floor(total / 4);
      if (possibleBread > 0) {
        setBread(b => b + possibleBread);
        const earned = possibleBread * (unlockedTechs["market_network"] ? 12 : 10);
        setMoney(m => m + earned);
        pushHist(`Cycle: ${produced} farine → ${possibleBread} pain vendus (+${earned}🪙)`);
        return +(total - possibleBread*4).toFixed(2);
      } else {
        pushHist(`Cycle: ${produced} farine produite.`);
        return total;
      }
    });

    // wages
    const wages = workers * (unlockedTechs["guilds"] ? 0.8 : 1);
    setMoney(m => Math.max(0, m - wages));
    // morale small change
    setMorale(m => Math.max(10, Math.min(100, m + (Math.random() > 0.9 ? -5 : Math.random()>0.6 ? 1 : 0))));
  }

  // user actions
  function grindManual() {
    if (wheat <= 0) { pushHist("Rien à moudre."); return; }
    setWheat(w=>w-1);
    const produced = +(1 * (unlockedTechs["wind_mill"] ? 1.4 : 1.0) * weatherMultipliers[weather]).toFixed(2);
    setFlour(f=>+(f + produced).toFixed(2));
    pushHist(`Moulage manuel: +${produced} farine`);
  }

  function buyWheat(q=20) {
    const pricePer = unlockedTechs["trade_routes"] ? 0.45 : 0.6;
    const total = Math.ceil(q*pricePer);
    if (money < total) { pushHist("Pas assez d'or."); return; }
    setMoney(m=>m-total);
    setWheat(w=>w+q);
    pushHist(`Achat: ${q} blé (-${total}🪙)`);
  }

  function hireWorker() {
    const cost = unlockedTechs["guilds"] ? 24 : 30;
    if (money < cost) { pushHist("Pas assez d'or pour embaucher."); return; }
    setMoney(m=>m-cost);
    setWorkers(w=>w+1);
    pushHist("Ouvrier embauché.");
  }

  function improveMill() {
    const cost = 150;
    if (money < cost) { pushHist("Pas assez d'or pour améliorer."); return; }
    setMoney(m=>m-cost);
    setCycleMs(c => Math.max(700, Math.round(c*0.8)));
    pushHist("Amélioration effectuée : cycles accélérés.");
  }

  // Save / load
  function saveGame() {
    const state = { wheat, flour, bread, money, cycleMs, workers, morale };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    pushHist("Sauvegarde effectuée.");
  }
  function resetGame() {
    if (!confirm("Réinitialiser la partie ?")) return;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(TECH_KEY);
    setWheat(240); setFlour(0); setBread(0); setMoney(200); setCycleMs(6000); setWorkers(1); setMorale(92);
    setUnlockedTechs({});
    pushHist("Partie réinitialisée.");
  }

  return (
    <div className="page">
      <WeatherArt weather={weather} />

      <header className="game-header">
        <div className="left">
          <h1>Medieval Mill Master</h1>
          <div className="sub">De la meule à la galaxie — prototype</div>
        </div>
        <div className="right stats">
          <div>🪙 {fmt(money)}</div>
          <div>🌾 {fmt(wheat)}</div>
          <div>🥖 {fmt(bread)}</div>
          <div>👷 {workers}</div>
        </div>
      </header>

      <main className="game-main">
        <section className="col left-col">
          <div className="card mill-card">
            <div className="mill-head">
              <h2>Moulin central</h2>
              <div className="sub">Cycle: {(cycleMs/1000).toFixed(1)}s • Météo: {weather}</div>
            </div>

            <div className="mill-zone">
              <div className="mill-svg">
                {/* simple SVG moulin: wheel + house */}
                <svg viewBox="0 0 300 200" className="mill-svg-el" preserveAspectRatio="xMidYMid meet" aria-hidden>
                  <g transform="translate(50,20)">
                    <rect x="70" y="40" width="90" height="60" rx="8" fill="#2f6be6" opacity="0.95"/>
                    <g className="wheel-g" transform="translate(40,60)">
                      <circle cx="0" cy="0" r="40" stroke="#bfe0ff" strokeWidth="6" fill="none" />
                      <g className="spokes">
                        {Array.from({length:8}).map((_,i)=>{
                          const rot = i*45;
                          return <line key={i} x1="0" y1="0" x2="0" y2="-36" stroke="#dbeeff" strokeWidth="4" transform={`rotate(${rot})`} strokeLinecap="round"/>
                        })}
                      </g>
                    </g>
                  </g>
                </svg>
              </div>

              <div className="meters">
                <div className="meter"><span>Farine</span><strong>{flour.toFixed(2)}</strong></div>
                <div className="meter"><span>Morale</span><strong>{morale}%</strong></div>
              </div>
            </div>

            <div className="controls">
              <button onClick={grindManual}>Moudre (manuel)</button>
              <button onClick={()=>buyWheat(20)}>Acheter 20 blé</button>
              <button onClick={hireWorker}>Embaucher (-{unlockedTechs["guilds"] ? 24 : 30}🪙)</button>
              <button onClick={improveMill}>Améliorer (-150🪙)</button>
            </div>
          </div>

          <div className="card shop-card">
            <h3>Atelier & marché</h3>
            <p>La farine se transforme automatiquement en pain (4 farine → 1 pain). Le pain est vendu automatiquement.</p>
            <div className="shop-controls">
              <button onClick={()=>{
                if (flour >= 1) { setFlour(f=>+(f-1).toFixed(2)); setMoney(m=>m+2); pushHist("Vendu 1 farine (+2🪙)"); } else pushHist("Pas assez de farine.");
              }}>Vendre 1 farine (+2🪙)</button>
              <button onClick={()=>{ saveGame(); }}>Sauvegarder</button>
              <button className="ghost" onClick={resetGame}>Réinitialiser</button>
            </div>
          </div>
        </section>

        <aside className="col right-col">
          <div className="card tech-short">
            <h3>Technologies rapides</h3>
            <div className="tech-row">
              <div className={`pill ${unlockedTechs["water_mill"] ? "on":""}`}>💧 Moulin à eau</div>
              <div className={`pill ${unlockedTechs["wind_mill"] ? "on":""}`}>💨 Moulin à vent</div>
            </div>
            <div style={{marginTop:10}}>
              <Link href="/technologie"><a className="link-btn">Ouvrir arbre technologique</a></Link>
            </div>
          </div>

          <div className="card events">
            <h3>Notifications</h3>
            <div className="current">{notif}</div>
            <ul className="hist">
              {history.map((h,i)=> <li key={i}>{h}</li>)}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="footer">Prototype — progression temporelle disponible sur la page Technologie</footer>

      <style jsx>{`
        :root { --accent:#3367d6; --accent2:#4285f4; --muted: #cfe3ff; }
        .page { min-height:100vh; background: linear-gradient(180deg,#061025 0%, #071427 60%); color:#eaf2ff; position:relative; overflow:hidden; padding-bottom:40px; }
        .game-header { display:flex; justify-content:space-between; align-items:center; padding:22px; max-width:1200px; margin:0 auto; z-index:3; position:relative; }
        .left h1 { margin:0; font-size:1.4rem; }
        .sub { color:rgba(255,255,255,0.6); margin-top:4px; font-size:0.9rem; }
        .stats { display:flex; gap:10px; align-items:center; color:var(--muted); font-weight:700; }
        .game-main { max-width:1200px; margin:18px auto 0; padding:12px 20px; display:flex; gap:18px; align-items:flex-start; z-index:3; position:relative; }
        .col { box-sizing:border-box; }
        .left-col { flex:2; display:flex; flex-direction:column; gap:12px; }
        .right-col { flex:1; display:flex; flex-direction:column; gap:12px; }

        .card { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,0.03); box-shadow: 0 8px 30px rgba(0,0,0,0.6); }
        .mill-zone { display:flex; gap:12px; align-items:center; padding:8px 0; }
        .mill-svg { width:300px; height:180px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00)); display:flex; align-items:center; justify-content:center; border-radius:8px; }
        .meters { display:flex; flex-direction:column; gap:6px; color:var(--muted); }
        .meter { display:flex; justify-content:space-between; font-weight:700; padding:6px 0; }

        .controls { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
        button { background: linear-gradient(90deg,var(--accent),var(--accent2)); border:none; color:white; padding:10px 12px; border-radius:10px; font-weight:800; cursor:pointer; box-shadow: 0 10px 30px rgba(51,103,214,0.12); }
        button.ghost { background:transparent; border:1px solid rgba(255,255,255,0.04); color:var(--muted); box-shadow:none; }
        .shop-controls button { margin-right:8px; }

        .tech-row { display:flex; gap:8px; align-items:center; margin-top:8px; }
        .pill { padding:8px 12px; border-radius:8px; background: rgba(255,255,255,0.02); color:var(--muted); font-weight:700; }
        .pill.on { background: linear-gradient(90deg,var(--accent),var(--accent2)); color:white; box-shadow: 0 8px 28px rgba(51,103,214,0.12); }

        .link-btn { display:inline-block; background: transparent; color: #bfe0ff; border:1px solid rgba(255,255,255,0.04); padding:8px 10px; border-radius:8px; text-decoration:none; }

        .events .current { color:#eaf0ff; font-weight:700; margin-bottom:8px; }
        .hist { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; color:var(--muted); max-height:200px; overflow:auto; }

        .footer { text-align:center; margin-top:18px; color:rgba(255,255,255,0.6); }

        /* wheel spin animation using CSS targeting the group (works with change of cycle via inline duration) */
        .wheel-g { transform-origin: center 60px; animation: spin linear infinite; animation-duration: 4s; animation-play-state: running; }
        @keyframes spin { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }

        /* responsive */
        @media (max-width:980px) {
          .game-main { flex-direction:column; padding:12px; }
          .mill-svg { width:100%; height:160px; }
        }
      `}</style>
    </div>
  );
}



