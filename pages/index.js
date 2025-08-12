// pages/index.js
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SAVE_KEY = "mm_save_v2";
const TECH_KEY = "mm_tech_v2";

/* -----------------------
   Helpers & Tech list excerpt (used to map epochs)
   ----------------------- */
const TECH_EPOCH_ORDER = [
  "Préhistoire",
  "Antiquité",
  "Moyen Âge",
  "Renaissance",
  "Révolution",
  "Moderne",
  "Spatiale"
];

function fmt(n) {
  if (n >= 1e6) return `${Math.round(n/1e5)/10}M`;
  if (n >= 1e3) return `${Math.round(n/100)/10}k`;
  return Math.floor(n);
}

/* small helper to derive dominant epoch from unlocked tech keys: 
   we keep a small mapping here to determine the current epoch.
   In the technologie page the IDs follow the same logic as earlier.
*/
const TECH_TO_EPOCH = {
  hand_tools: "Préhistoire",
  fire: "Préhistoire",
  wheel_stone: "Antiquité",
  water_mill: "Antiquité",
  wheel_iron: "Moyen Âge",
  guilds: "Moyen Âge",
  wind_mill: "Renaissance",
  steam_engine: "Révolution",
  factory_lines: "Révolution",
  electric_motors: "Moderne",
  computing: "Moderne",
  ai_automation: "Moderne",
  space_mining: "Spatiale",
  fusion_drive: "Spatiale",
  colonies: "Spatiale",
  market_network: "Moderne",
  trade_routes: "Moderne"
};

/* -----------------------
   Worker Avatar component (simple SVG person)
   ----------------------- */
function Worker({ index, active, offsetX }) {
  // offsetX in px to move worker horizontally (animated via CSS)
  return (
    <div className={`worker ${active ? "active" : ""}`} style={{ left: `${offsetX}px` }} aria-hidden>
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="10" r="8" fill="#ffd8b6"/>
        <rect x="6" y="20" width="24" height="20" rx="4" fill="#5a7be6"/>
        <rect x="10" y="34" width="6" height="8" rx="2" fill="#1f2a57"/>
        <rect x="20" y="34" width="6" height="8" rx="2" fill="#1f2a57"/>
      </svg>
      <style jsx>{`
        .worker {
          position:absolute;
          bottom:10px;
          transform:translateY(0);
          transition: left 1s linear;
          pointer-events:none;
          opacity:0.95;
        }
        .worker.active { transform: translateY(-6px); filter: drop-shadow(0 6px 18px rgba(0,0,0,0.45)); }
      `}</style>
    </div>
  );
}

/* -----------------------
   Weather visual mini-component
   ----------------------- */
function WeatherVisual({ weather, era }) {
  // era alters colors/filters
  return (
    <div className={`weather-visual ${weather.toLowerCase()} ${era?.toLowerCase?.() || ""}`} aria-hidden>
      <div className="sun" />
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="rain">
        {Array.from({ length: 18 }).map((_, i) => (
          <div className="drop" key={i} style={{ left: `${i * 5 + (i % 3)}%`, animationDelay: `${i * 70}ms` }} />
        ))}
      </div>

      <style jsx>{`
        .weather-visual { position:absolute; inset:0; pointer-events:none; z-index:0; transition:opacity .6s; }
        .sun { position:absolute; right:8%; top:8%; width:84px; height:84px; border-radius:50%; background: radial-gradient(circle at 30% 30%, #fff8c4, #ffc857); box-shadow:0 18px 60px rgba(255,170,60,0.12); opacity:0.95; }
        .cloud { position:absolute; background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); border-radius:40px; box-shadow: inset 0 -12px 28px rgba(0,0,0,0.30); }
        .c1 { width:220px; height:56px; left:6%; top:8%; }
        .c2 { width:260px; height:72px; left:36%; top:22%; opacity:0.9; transform:scale(0.95); }
        .rain { position:absolute; inset:0; opacity:0; }
        .drop { position:absolute; top:16%; width:2px; height:26px; background: linear-gradient(#fff,#bfe0ff); border-radius:2px; transform: translateY(-8vh); animation: fall 900ms linear infinite; }
        @keyframes fall { 0% { transform:translateY(-8vh); opacity:0 } 10% { opacity:1 } 100% { transform:translateY(90vh); opacity:0 } }
        .weather-visual.soleil .sun { opacity:1; }
        .weather-visual.soleil .rain { opacity:0; }
        .weather-visual.pluie .sun { opacity:0.25; transform: translateY(-8px) scale(0.95); }
        .weather-visual.pluie .rain { opacity:1; }
        .weather-visual.sécheresse .sun { opacity:0.95; transform: translateY(-4px); filter: saturate(0.9) brightness(1.02); }
        /* Era tinting */
        .weather-visual.préhistoire { filter: hue-rotate(-10deg) saturate(1.02) contrast(0.95); }
        .weather-visual.moyen\ âge { filter: hue-rotate(0deg) saturate(1) contrast(1); }
        .weather-visual.révolution { filter: hue-rotate(10deg) saturate(1.05); }
        .weather-visual.modern e { filter: none; }
        .weather-visual.spatiale { filter: saturate(1.1) contrast(1.05); }
      `}</style>
    </div>
  );
}

/* -----------------------
   Main Page Component
   ----------------------- */
export default function Home() {
  // core resources
  const [wheat, setWheat] = useState(200);
  const [flour, setFlour] = useState(0);
  const [bread, setBread] = useState(0);
  const [money, setMoney] = useState(250);

  // production / workers
  const [cycleMs, setCycleMs] = useState(6000);
  const [workers, setWorkers] = useState(1);
  const [morale, setMorale] = useState(92);
  const [weather, setWeather] = useState("Soleil");

  // tech
  const [unlocked, setUnlocked] = useState({});

  // UI
  const [notif, setNotif] = useState("Bienvenue !");
  const [history, setHistory] = useState([]);

  // autosave & refs
  const autosaveRef = useRef(null);
  const cycleRef = useRef(null);
  const mountedRef = useRef(false);

  // derive current era from unlocked techs
  function getEraFromUnlocked(u) {
    // find highest order epoch among unlocked; default Préhistoire -> Moyen Âge -> ... Spatiale
    const epochsUnlocked = new Set();
    Object.keys(u || {}).forEach(k => {
      const e = TECH_TO_EPOCH[k];
      if (e) epochsUnlocked.add(e);
    });
    // choose the latest epoch present by TECH_EPOCH_ORDER index
    for (let i = TECH_EPOCH_ORDER.length - 1; i >= 0; i--) {
      if (epochsUnlocked.has(TECH_EPOCH_ORDER[i])) return TECH_EPOCH_ORDER[i];
    }
    return "Préhistoire";
  }
  const currentEra = getEraFromUnlocked(unlocked);

  // multipliers based on unlocked techs (read minimal set of ids)
  function computeMultipliers(u) {
    let speed = 1; // lower is faster
    let yieldMult = 1;
    if (u["hand_tools"]) yieldMult *= 1.08;
    if (u["wheel_stone"]) yieldMult *= 1.05;
    if (u["water_mill"]) { speed *= 0.75; yieldMult *= 1.15; }
    if (u["wind_mill"]) { speed *= 0.6; yieldMult *= 1.25; }
    if (u["steam_engine"]) { speed *= 0.45; yieldMult *= 1.45; }
    if (u["electric_motors"]) { speed *= 0.32; yieldMult *= 1.6; }
    if (u["ai_automation"]) { speed *= 0.18; yieldMult *= 2.0; }
    return { speed, yieldMult };
  }

  // load save & techs on mount
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (s) {
        setWheat(s.wheat ?? 200);
        setFlour(s.flour ?? 0);
        setBread(s.bread ?? 0);
        setMoney(s.money ?? 250);
        setCycleMs(s.cycleMs ?? 6000);
        setWorkers(s.workers ?? 1);
        setMorale(s.morale ?? 92);
        pushHist("Sauvegarde chargée.");
      } else {
        pushHist("Nouvelle partie créée.");
      }
    } catch (e) {
      console.error(e);
      pushHist("Erreur chargement sauvegarde.");
    }
    try {
      const t = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
      setUnlocked(t || {});
    } catch (e) {
      setUnlocked({});
    }
    mountedRef.current = true;

    // listen for storage events (other tabs or explicit events)
    function onStorage(e) {
      if (e.key === TECH_KEY) {
        const newT = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
        setUnlocked(newT || {});
        pushHist("Technologies mises à jour.");
      }
      if (e.key === SAVE_KEY) {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
        if (s) {
          setMoney(s.money ?? money);
          setWheat(s.wheat ?? wheat);
          pushHist("Sauvegarde externe chargée.");
        }
      }
    }
    window.addEventListener("storage", onStorage);

    // listen for custom event triggered by /technologie after unlocking (single-tab)
    function onTechUpdated() {
      const newT = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
      setUnlocked(newT || {});
      pushHist("Technologie débloquée (appliquée).");
    }
    window.addEventListener("tech-updated", onTechUpdated);

    // save on unload
    function onBeforeUnload() { autoSave(); }
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tech-updated", onTechUpdated);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply tech multipliers to cycleMs whenever unlocked changes
  useEffect(() => {
    const base = 6000;
    const mult = computeMultipliers(unlocked);
    setCycleMs(Math.max(700, Math.round(base * mult.speed)));
    // persist unlocked in localStorage (keeps tech page and game in sync)
    localStorage.setItem(TECH_KEY, JSON.stringify(unlocked));
    // no pushHist here to avoid spam on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // production main loop with workers influence
  useEffect(() => {
    if (!mountedRef.current) return;
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      produceCycle();
    }, cycleMs);
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleMs, workers, weather, unlocked, morale]);

  // autosave interval
  useEffect(() => {
    if (autosaveRef.current) clearInterval(autosaveRef.current);
    autosaveRef.current = setInterval(() => {
      autoSave();
    }, 5000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [wheat, flour, bread, money, cycleMs, workers, morale, unlocked]);

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

  function pushHist(msg) {
    const label = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${msg}`;
    setNotif(msg);
    setHistory(h => [label, ...h].slice(0, 80));
  }

  function autoSave() {
    try {
      const state = { wheat, flour, bread, money, cycleMs, workers, morale, timestamp: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      pushHist("Autosave effectuée.");
    } catch (e) {
      console.error("Autosave failed", e);
      pushHist("Erreur d'autosave.");
    }
  }

  /* ---------- Gameplay Actions ---------- */
  function produceCycle() {
    // workers determine consumption and production rate
    const baseConsume = Math.max(1, workers);
    if (wheat <= 0) {
      pushHist("Plus de blé — acheter du blé !");
      return;
    }
    const consume = Math.min(wheat, baseConsume);
    setWheat(w => Math.max(0, w - consume));

    const techYield = computeMultipliers(unlocked).yieldMult;
    // workers give additive bonus: more workers -> allow parallel production: base * (1 + workers*0.12)
    const workerEffect = 1 + Math.min(5, workers * 0.12);
    const produced = +(consume * techYield * workerEffect * (weather === "Soleil" ? 1 : weather === "Pluie" ? 0.85 : 0.5) * (1 + (morale/1000))).toFixed(2);
    setFlour(f => +(f + produced).toFixed(2));

    // convert flour -> bread & sell
    setFlour(f => {
      const total = +(f + produced).toFixed(2);
      const possibleBread = Math.floor(total / 4);
      if (possibleBread > 0) {
        setBread(b => b + possibleBread);
        const unitPrice = unlocked["market_network"] ? 12 : 10;
        setMoney(m => m + possibleBread * unitPrice);
        pushHist(`Cycle: ${produced} farine → ${possibleBread} pain vendus (+${possibleBread * unitPrice}🪙)`);
        return +(total - possibleBread * 4).toFixed(2);
      } else {
        pushHist(`Cycle: ${produced} farine produite.`);
        return total;
      }
    });

    // pay wages
    const wage = Math.max(0, Math.round(workers * (unlocked["guilds"] ? 0.8 : 1)));
    setMoney(m => Math.max(0, m - wage));
    setMorale(m => Math.max(10, Math.min(100, m + (Math.random() > 0.88 ? -4 : Math.random() > 0.6 ? 1 : 0))));
  }

  function grindManual() {
    if (wheat <= 0) { pushHist("Pas de blé à moudre."); return; }
    setWheat(w => w - 1);
    const produced = +(1 * computeMultipliers(unlocked).yieldMult * (weather === "Soleil" ? 1 : weather === "Pluie" ? 0.85 : 0.5)).toFixed(2);
    setFlour(f => +(f + produced).toFixed(2));
    pushHist(`Moulage manuel : +${produced} farine.`);
    autoSave();
  }

  function buyWheat(q = 20) {
    const unit = unlocked["trade_routes"] ? 0.45 : 0.6;
    const cost = Math.ceil(q * unit);
    if (money < cost) { pushHist("Pas assez d'or."); return; }
    setMoney(m => m - cost);
    setWheat(w => w + q);
    pushHist(`Acheté ${q} blé (-${cost}🪙).`);
    autoSave();
  }

  function hireWorker() {
    const cost = unlocked["guilds"] ? 24 : 30;
    if (money < cost) { pushHist("Pas assez d'or pour embaucher."); return; }
    setMoney(m => m - cost);
    setWorkers(w => w + 1);
    pushHist("Ouvrier embauché.");
    autoSave();
  }

  function improveMill() {
    const cost = 160;
    if (money < cost) { pushHist("Pas assez d'or pour améliorer."); return; }
    setMoney(m => m - cost);
    setCycleMs(c => Math.max(600, Math.round(c * 0.78)));
    pushHist("Moulin amélioré : cycles plus rapides.");
    autoSave();
  }

  /* ---------- UI helpers ---------- */
  // compute positions for worker avatars (simple spread)
  const workerPositions = Array.from({ length: workers }).map((_, i) => (i * 36) + 6);

  /* ---------- Render ---------- */
  return (
    <div className={`page root-era-${currentEra.toLowerCase().replace(/\s/g,'-')}`}>
      <WeatherVisual weather={weather} era={currentEra} />

      <header className="top">
        <div className="brand">
          <div className="logo">🏰</div>
          <div>
            <div className="title">Medieval Mill Master</div>
            <div className="tagline">{currentEra} — Gestion & progression temporelle</div>
          </div>
        </div>

        <nav className="top-actions">
          <Link href="/technologie"><a className="btn ghost">Arbre Technologie</a></Link>
          <button className="btn" onClick={() => { pushHist("Sauvegarde manuelle..."); autoSave(); }}>Sauvegarder</button>
        </nav>
      </header>

      <main className="main">
        <section className="left">
          <div className="card mill">
            <div className="mill-visual">
              {/* SVG moulin stylisé */}
              <svg viewBox="0 0 360 220" className="mill-svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
                <g transform="translate(60,20)">
                  <rect x="70" y="40" width="98" height="66" rx="8" fill="#335ef0" opacity="0.95" />
                  <g transform="translate(30,80)" className="wheel-group">
                    <circle cx="0" cy="0" r="44" stroke="#dbeeff" strokeWidth="6" fill="rgba(0,0,0,0.06)"/>
                    <g className="spokes">
                      {Array.from({ length: 8 }).map((_, i) => {
                        const rot = i * 45;
                        return <line key={i} x1="0" y1="0" x2="0" y2="-38" stroke="#e6f2ff" strokeWidth="4" transform={`rotate(${rot})`} strokeLinecap="round" />;
                      })}
                    </g>
                  </g>
                </g>
              </svg>

              {/* worker avatars overlay */}
              <div className="workers">
                {workerPositions.map((pos, i) => (
                  <Worker key={i} index={i} active={true} offsetX={pos} />
                ))}
              </div>
            </div>

            <div className="mill-info">
              <div className="stat-row"><span>🪙 Argent</span><strong>{fmt(money)}</strong></div>
              <div className="stat-row"><span>🌾 Blé</span><strong>{fmt(wheat)}</strong></div>
              <div className="stat-row"><span>🥖 Pain</span><strong>{fmt(bread)}</strong></div>
              <div className="stat-row"><span>👷 Ouvriers</span><strong>{workers}</strong></div>
              <div className="stat-row"><span>⏱ Cycle</span><strong>{(cycleMs/1000).toFixed(1)}s</strong></div>
            </div>

            <div className="controls">
              <button onClick={grindManual}>Moudre (manuel)</button>
              <button onClick={() => buyWheat(20)}>Acheter 20 blé</button>
              <button onClick={hireWorker}>Embaucher (-{unlocked["guilds"] ? 24 : 30}🪙)</button>
              <button onClick={improveMill}>Améliorer (-160🪙)</button>
            </div>
          </div>

          <div className="card market">
            <h3>Atelier & marché</h3>
            <p>Farine → pain (4 farine = 1 pain). Le pain est vendu automatiquement.</p>
            <div className="small-controls">
              <button onClick={() => { if (flour >= 1) { setFlour(f => +(f - 1).toFixed(2)); setMoney(m => m + 2); pushHist("Vendu 1 farine (+2🪙)"); autoSave(); } else pushHist("Pas assez de farine."); }}>Vendre 1 farine</button>
              <button onClick={() => { setBread(0); pushHist("Vider stock pain (debug)"); autoSave(); }} className="ghost">Vider pain</button>
            </div>
          </div>
        </section>

        <aside className="right">
          <div className="card tech-quick">
            <h4>Tech rapide</h4>
            <div className="tech-badges">
              <div className={`badge ${unlocked["hand_tools"] ? "on" : ""}`}>🪨</div>
              <div className={`badge ${unlocked["water_mill"] ? "on" : ""}`}>💧</div>
              <div className={`badge ${unlocked["wind_mill"] ? "on" : ""}`}>💨</div>
              <div className={`badge ${unlocked["ai_automation"] ? "on" : ""}`}>🤖</div>
            </div>
            <div style={{ marginTop: 10 }}>
              <Link href="/technologie"><a className="link">Ouvrir l'arbre techno →</a></Link>
            </div>
          </div>

          <div className="card events">
            <h4>Évènements & notifications</h4>
            <div className="current">{notif}</div>
            <ul className="history">
              {history.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
            <div className="controls small">
              <label><input type="checkbox" checked readOnly /> Autosave (actif)</label>
              <button onClick={() => { pushHist("Sauvegarde manuelle déclenchée"); autoSave(); }} className="ghost">Sauvegarder</button>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">Prototype — progression visible par époque • Sauvegarde automatique et sync techno</footer>

      <style jsx>{`
        :root{ --accent:#3367d6; --accent2:#4285f4; --muted:#cfe3ff; }
        .page { min-height:100vh; position:relative; color:#ecf4ff; background: linear-gradient(180deg,#07102a 0%, #071827 60%); overflow:hidden; }
        /* Era backgrounds */
        .root-era-préhistoire { background-image: radial-gradient(circle at 20% 20%, rgba(80,40,0,0.08), transparent), linear-gradient(180deg,#081018,#071226); }
        .root-era-antiquité { background-image: linear-gradient(180deg,#071227,#082035); }
        .root-era-moyen-âge { background-image: linear-gradient(180deg,#061426,#07182a); }
        .root-era-révolution { background-image: linear-gradient(180deg,#051428,#071c36); }
        .root-era-moderne { background-image: linear-gradient(180deg,#071431,#07183a); }
        .root-era-spatiale { background-image: linear-gradient(180deg,#01031a,#04102a); }

        .top { display:flex; justify-content:space-between; align-items:center; padding:16px 28px; position:relative; z-index:6; }
        .brand { display:flex; gap:12px; align-items:center; }
        .logo { width:46px; height:46px; background: linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 10px 30px rgba(51,103,214,0.12); }
        .title { font-weight:900; font-size:1.1rem; }
        .tagline { color: rgba(255,255,255,0.7); font-size:0.9rem; margin-top:4px; }

        .top-actions { display:flex; gap:10px; align-items:center; }
        .btn { background: linear-gradient(90deg,var(--accent),var(--accent2)); padding:8px 12px; border-radius:8px; border:none; color:white; font-weight:800; cursor:pointer; }
        .btn.ghost { background:transparent; border:1px solid rgba(255,255,255,0.04); color:var(--muted); }

        .main { display:flex; gap:18px; padding:18px 28px; max-width:1200px; margin:0 auto; z-index:6; }
        .left { flex:2; display:flex; flex-direction:column; gap:14px; }
        .right { flex:1; display:flex; flex-direction:column; gap:12px; }

        .card { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:12px; padding:14px; border:1px solid rgba(255,255,255,0.03); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }

        /* mill */
        .mill { display:flex; flex-direction:column; gap:8px; }
        .mill-visual { position:relative; display:flex; gap:12px; align-items:center; padding:8px; min-height:180px; }
        .mill-svg { width:360px; height:220px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00)); border-radius:10px; display:flex; align-items:center; justify-content:center; position:relative; z-index:2; }
        .workers { position:absolute; bottom:20px; left:40px; right:40px; pointer-events:none; height:72px; }

        .mill-info { display:flex; flex-direction:column; gap:6px; color:var(--muted); font-weight:700; }
        .stat-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; }

        .controls { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
        button { background: linear-gradient(90deg,var(--accent),var(--accent2)); border:none; color:white; padding:9px 12px; border-radius:10px; font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(51,103,214,0.12); }
        button.ghost { background:transparent; border:1px solid rgba(255,255,255,0.04); color:var(--muted); }

        .market { display:flex; flex-direction:column; gap:8px; }
        .small-controls { display:flex; gap:8px; }

        .tech-quick .tech-badges { display:flex; gap:8px; margin-top:8px; }
        .badge { background: rgba(255,255,255,0.02); padding:8px; border-radius:8px; font-weight:800; color:var(--muted); }
        .badge.on { background: linear-gradient(90deg,var(--accent),var(--accent2)); color:white; box-shadow:0 8px 22px rgba(51,103,214,0.12); }

        .events .current { font-weight:800; color:#eaf5ff; margin-bottom:6px; }
        .history { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; color:var(--muted); max-height:240px; overflow:auto; }

        .footer { margin-top:16px; text-align:center; color:rgba(255,255,255,0.6); padding:14px 0; }

        /* responsive */
        @media (max-width: 980px) {
          .main { flex-direction:column; padding:12px; }
          .mill-svg { width:100%; height:160px; }
        }
      `}</style>
    </div>
  );
}




