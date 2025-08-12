// pages/index.js
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SAVE_KEY = "mm_save_v2";
const TECH_KEY = "mm_tech_v2";

/* ----------------------
  UTILITAIRES
-----------------------*/
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmt(n) {
  if (n >= 1e6) return `${Math.round(n/1e5)/10}M`;
  if (n >= 1e3) return `${Math.round(n/100)/10}k`;
  return Math.floor(n);
}

/* ----------------------
  SPRITES OUVRIERS (3 variantes)
  Each returns an inline SVG representing a worker variant.
  We'll animate a walking loop by shifting limbs via CSS keyframes.
-----------------------*/

function WorkerSpriteA({ className = "" }) {
  return (
    <svg className={className} width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="skinA" x1="0" x2="1"><stop offset="0" stopColor="#ffd8b6"/><stop offset="1" stopColor="#ffc29a"/></linearGradient>
        <linearGradient id="clothA" x1="0" x2="1"><stop offset="0" stopColor="#3a6be6"/><stop offset="1" stopColor="#2353b2"/></linearGradient>
      </defs>
      {/* head */}
      <circle cx="24" cy="10" r="8" fill="url(#skinA)"/>
      {/* body */}
      <rect x="10" y="18" rx="4" ry="4" width="28" height="22" fill="url(#clothA)"/>
      {/* arms */}
      <g className="arm-left">
        <rect x="6" y="22" width="8" height="6" rx="3" fill="#3a6be6"/>
      </g>
      <g className="arm-right">
        <rect x="34" y="22" width="8" height="6" rx="3" fill="#3a6be6"/>
      </g>
      {/* legs */}
      <g className="leg-left">
        <rect x="12" y="40" width="8" height="14" rx="3" fill="#283a65"/>
      </g>
      <g className="leg-right">
        <rect x="28" y="40" width="8" height="14" rx="3" fill="#283a65"/>
      </g>

      <style jsx>{`
        svg { display:block; }
        /* walking animation */
        .arm-left { transform-origin: 10px 24px; animation: swingA 700ms linear infinite; }
        .arm-right { transform-origin: 40px 24px; animation: swingA 700ms linear infinite reverse; }
        .leg-left { transform-origin: 16px 40px; animation: stepA 700ms linear infinite reverse; }
        .leg-right { transform-origin: 32px 40px; animation: stepA 700ms linear infinite; }

        @keyframes swingA {
          0% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
          100% { transform: rotate(-12deg); }
        }
        @keyframes stepA {
          0% { transform: translateY(0) rotate(6deg); }
          50% { transform: translateY(-4px) rotate(-6deg); }
          100% { transform: translateY(0) rotate(6deg); }
        }
      `}</style>
    </svg>
  );
}

function WorkerSpriteB({ className = "" }) {
  return (
    <svg className={className} width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="skinB" x1="0" x2="1"><stop offset="0" stopColor="#ffe2c9"/><stop offset="1" stopColor="#ffcfb2"/></linearGradient>
        <linearGradient id="clothB" x1="0" x2="1"><stop offset="0" stopColor="#f08b3f"/><stop offset="1" stopColor="#cf5f1a"/></linearGradient>
      </defs>
      <circle cx="24" cy="10" r="8" fill="url(#skinB)"/>
      <rect x="10" y="18" rx="4" ry="4" width="28" height="22" fill="url(#clothB)"/>
      <g className="arm-left-b"><rect x="6" y="22" width="8" height="6" rx="3" fill="#f08b3f"/></g>
      <g className="arm-right-b"><rect x="34" y="22" width="8" height="6" rx="3" fill="#f08b3f"/></g>
      <g className="leg-left-b"><rect x="12" y="40" width="8" height="14" rx="3" fill="#7b3f20"/></g>
      <g className="leg-right-b"><rect x="28" y="40" width="8" height="14" rx="3" fill="#7b3f20"/></g>

      <style jsx>{`
        svg { display:block; }
        .arm-left-b { transform-origin: 10px 24px; animation: swingB 820ms linear infinite reverse; }
        .arm-right-b { transform-origin: 40px 24px; animation: swingB 820ms linear infinite; }
        .leg-left-b { transform-origin: 16px 40px; animation: stepB 820ms linear infinite; }
        .leg-right-b { transform-origin: 32px 40px; animation: stepB 820ms linear infinite reverse; }

        @keyframes swingB {
          0% { transform: rotate(-18deg); }
          50% { transform: rotate(12deg); }
          100% { transform: rotate(-18deg); }
        }
        @keyframes stepB {
          0% { transform: translateY(0) rotate(8deg); }
          50% { transform: translateY(-6px) rotate(-8deg); }
          100% { transform: translateY(0) rotate(8deg); }
        }
      `}</style>
    </svg>
  );
}

function WorkerSpriteC({ className = "" }) {
  return (
    <svg className={className} width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="skinC" x1="0" x2="1"><stop offset="0" stopColor="#ffdcbf"/><stop offset="1" stopColor="#ffc8a2"/></linearGradient>
        <linearGradient id="clothC" x1="0" x2="1"><stop offset="0" stopColor="#2db48f"/><stop offset="1" stopColor="#1b7b64"/></linearGradient>
      </defs>
      <circle cx="24" cy="10" r="8" fill="url(#skinC)"/>
      <rect x="10" y="18" rx="4" ry="4" width="28" height="22" fill="url(#clothC)"/>
      <g className="arm-left-c"><rect x="6" y="22" width="8" height="6" rx="3" fill="#2db48f"/></g>
      <g className="arm-right-c"><rect x="34" y="22" width="8" height="6" rx="3" fill="#2db48f"/></g>
      <g className="leg-left-c"><rect x="12" y="40" width="8" height="14" rx="3" fill="#134c3a"/></g>
      <g className="leg-right-c"><rect x="28" y="40" width="8" height="14" rx="3" fill="#134c3a"/></g>

      <style jsx>{`
        svg { display:block; }
        .arm-left-c { transform-origin: 10px 24px; animation: swingC 760ms linear infinite; }
        .arm-right-c { transform-origin: 40px 24px; animation: swingC 760ms linear infinite reverse; }
        .leg-left-c { transform-origin: 16px 40px; animation: stepC 760ms linear infinite; }
        .leg-right-c { transform-origin: 32px 40px; animation: stepC 760ms linear infinite reverse; }

        @keyframes swingC {
          0% { transform: rotate(-10deg); }
          50% { transform: rotate(14deg); }
          100% { transform: rotate(-10deg); }
        }
        @keyframes stepC {
          0% { transform: translateY(0) rotate(4deg); }
          50% { transform: translateY(-5px) rotate(-4deg); }
          100% { transform: translateY(0) rotate(4deg); }
        }
      `}</style>
    </svg>
  );
}

/* ----------------------
  Moulin SVG DETAILED
  - wheel, large gear, small gear, connecting axle, piston (for industrial vibe)
  - multiple rotating elements with different speeds for realism
-----------------------*/
function DetailedMill({ spinDuration = 4000, era = "Moyen Âge" }) {
  // era can be used to change textures/colors
  const isPrehistoric = era === "Préhistoire";
  const woodColor = isPrehistoric ? "#7a5230" : "#3a6be6";
  const metal = "#dbeeff";

  return (
    <div className="detailed-mill" aria-hidden>
      <svg viewBox="0 0 520 320" className="mill-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="woodGrad" x1="0" x2="1"><stop offset="0" stopColor="#9a6b3f"/><stop offset="1" stopColor="#6f3f1f"/></linearGradient>
          <linearGradient id="metalGrad" x1="0" x2="1"><stop offset="0" stopColor="#e8f4ff"/><stop offset="1" stopColor="#bcd9ff"/></linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="24" floodColor="#03102a" floodOpacity="0.28"/>
          </filter>
        </defs>

        {/* building */}
        <g transform="translate(30,20)">
          <rect x="180" y="40" width="220" height="120" rx="12" fill="url(#woodGrad)" filter="url(#softShadow)"/>
          <polygon points="180,40 290,0 400,40" fill="#5d3f22"/>
          {/* window */}
          <rect x="240" y="66" width="40" height="28" rx="4" fill="#e9f7ff" opacity="0.12"/>
        </g>

        {/* big wheel group */}
        <g transform="translate(120,170)" className="wheel-big">
          <circle cx="0" cy="0" r="72" fill="none" stroke={metal} strokeWidth="10" />
          {/* paddles */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            return <rect key={i} x="-6" y="-72" width="12" height="36" rx="3" fill="#5b7fdc" transform={`rotate(${angle})`} />;
          })}
          <circle cx="0" cy="0" r="18" fill={metal} />
        </g>

        {/* gear train */}
        <g transform="translate(260,170)">
          <g className="gear-large" transform="translate(-60,0)">
            <circle cx="0" cy="0" r="36" fill="url(#metalGrad)" stroke="#c8e0ff" strokeWidth="6"/>
            {/* teeth */}
            {Array.from({length:16}).map((_,i)=>{
              const a = i * (360/16);
              return <rect key={i} x="-6" y="-46" width="12" height="10" fill="#bfdcff" transform={`rotate(${a}) translate(0, -6)`} />;
            })}
          </g>

          <g className="gear-small" transform="translate(40,0)">
            <circle cx="0" cy="0" r="18" fill="url(#metalGrad)" stroke="#c8e0ff" strokeWidth="4"/>
            {Array.from({length:12}).map((_,i)=>{
              const a = i * (360/12);
              return <rect key={i} x="-4" y="-28" width="8" height="6" fill="#cfe6ff" transform={`rotate(${a}) translate(0, -4)`} />;
            })}
          </g>

          {/* piston */}
          <g className="piston" transform="translate(120,-6)">
            <rect x="-6" y="-36" width="40" height="14" rx="6" fill="#7a7a7a" />
            <rect x="-2" y="-80" width="20" height="50" rx="6" fill="#dfeeff" />
          </g>
        </g>

        <style jsx>{`
          .mill-svg { width:100%; height:100%; max-height:320px; display:block; }
          /* wheel big rotates slowly */
          .wheel-big { transform-origin: 120px 170px; animation: spinWheel var(--spin) linear infinite; }
          .gear-large { transform-origin: 200px 170px; animation: spinLarge calc(var(--spin) * 0.6) linear infinite reverse; }
          .gear-small { transform-origin: 300px 170px; animation: spinSmall calc(var(--spin) * 0.32) linear infinite; }
          .piston { transform-origin: 120px 80px; animation: pistonMove calc(var(--spin) * 0.28) linear infinite; }

          @keyframes spinWheel { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
          @keyframes spinLarge { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
          @keyframes spinSmall { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
          @keyframes pistonMove {
            0% { transform: translateY(0); }
            50% { transform: translateY(12px); }
            100% { transform: translateY(0); }
          }
        `}</style>
      </svg>

      {/* control CSS var for speed */}
      <style jsx>{`
        :root { --spin: ${spinDuration}ms; }
        .detailed-mill { width:100%; height:100%; }
      `}</style>
    </div>
  );
}

/* ----------------------
 MAIN PAGE (mise à jour visuelle + logique)
 We keep most of the gameplay logic (production, workers, autosave, tech sync).
-----------------------*/

export default function Home() {
  // resources
  const [wheat, setWheat] = useState(220);
  const [flour, setFlour] = useState(0);
  const [bread, setBread] = useState(0);
  const [money, setMoney] = useState(260);

  // production/workers
  const [workers, setWorkers] = useState(1);
  const [morale, setMorale] = useState(92);
  const [cycleMs, setCycleMs] = useState(6000);
  const [weather, setWeather] = useState("Soleil");

  // tech unlocked
  const [unlocked, setUnlocked] = useState({});

  // ui
  const [notif, setNotif] = useState("Bienvenue au moulin amélioré !");
  const [history, setHistory] = useState([]);

  // refs
  const mountedRef = useRef(false);
  const cycleRef = useRef(null);

  // load save & techs
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (s) {
        setWheat(s.wheat ?? 220);
        setFlour(s.flour ?? 0);
        setBread(s.bread ?? 0);
        setMoney(s.money ?? 260);
        setWorkers(s.workers ?? 1);
        setMorale(s.morale ?? 92);
        setCycleMs(s.cycleMs ?? 6000);
        pushHist("Sauvegarde chargée.");
      } else pushHist("Nouvelle partie.");
    } catch (e) { pushHist("Erreur chargement."); }
    try {
      const t = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
      setUnlocked(t || {});
    } catch (e) { setUnlocked({}); }
    mountedRef.current = true;

    // listen for tech-updated event
    function onTech() {
      try { const t = JSON.parse(localStorage.getItem(TECH_KEY) || "{}"); setUnlocked(t || {}); pushHist("Technologie appliquée."); } catch(e){}
    }
    window.addEventListener("tech-updated", onTech);
    window.addEventListener("storage", (e) => {
      if (e.key === TECH_KEY) onTech();
      if (e.key === SAVE_KEY) {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
        if (s) { setMoney(s.money ?? money); setWheat(s.wheat ?? wheat); pushHist("Sauvegarde externe chargée."); }
      }
    });

    return () => { window.removeEventListener("tech-updated", onTech); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply tech effects to cycle / speed
  useEffect(() => {
    // simple multipliers as previously
    let base = 6000;
    if (unlocked["hand_tools"]) base *= 0.98;
    if (unlocked["water_mill"]) base *= 0.75;
    if (unlocked["wind_mill"]) base *= 0.6;
    if (unlocked["steam_engine"]) base *= 0.45;
    if (unlocked["electric_motors"]) base *= 0.32;
    if (unlocked["ai_automation"]) base *= 0.18;
    setCycleMs(Math.max(700, Math.round(base)));
  }, [unlocked]);

  // production loop
  useEffect(() => {
    if (!mountedRef.current) return;
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => { productionCycle(); }, cycleMs);
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleMs, workers, weather, unlocked, morale]);

  // weather auto change
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.random();
      if (r < 0.6) setWeather("Soleil");
      else if (r < 0.9) setWeather("Pluie");
      else setWeather("Sécheresse");
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // autsave
  useEffect(() => {
    const id = setInterval(()=>{ saveGame(); }, 6000);
    return ()=> clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheat, flour, bread, money, workers, unlocked]);

  function pushHist(msg) {
    const label = `${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — ${msg}`;
    setNotif(msg);
    setHistory(h => [label, ...h].slice(0,80));
  }

  function computeMultipliers(u) {
    let yieldMult = 1;
    if (u["hand_tools"]) yieldMult *= 1.08;
    if (u["wheel_stone"]) yieldMult *= 1.05;
    if (u["water_mill"]) yieldMult *= 1.15;
    if (u["wind_mill"]) yieldMult *= 1.25;
    if (u["steam_engine"]) yieldMult *= 1.45;
    if (u["electric_motors"]) yieldMult *= 1.6;
    if (u["ai_automation"]) yieldMult *= 2.0;
    return { yieldMult };
  }

  function productionCycle() {
    const consume = Math.max(1, workers);
    if (wheat <= 0) { pushHist("Plus de blé — achetez du blé !"); return; }
    const actually = Math.min(wheat, consume);
    setWheat(w => Math.max(0, w - actually));
    const ym = computeMultipliers(unlocked).yieldMult;
    const workerEffect = 1 + Math.min(5, workers * 0.12);
    const produced = +(actually * ym * workerEffect * (weather === "Soleil" ? 1 : weather === "Pluie" ? 0.85 : 0.5) * (1 + (morale/1000))).toFixed(2);
    setFlour(f => +(f + produced).toFixed(2));

    // convert to bread & sell
    setFlour(f => {
      const total = +(f + produced).toFixed(2);
      const breadPossible = Math.floor(total / 4);
      if (breadPossible > 0) {
        setBread(b => b + breadPossible);
        const price = unlocked["market_network"] ? 12 : 10;
        setMoney(m => m + breadPossible * price);
        pushHist(`Cycle: ${produced} farine → ${breadPossible} pain vendus (+${breadPossible * price}🪙)`);
        return +(total - breadPossible * 4).toFixed(2);
      } else { pushHist(`Cycle: ${produced} farine produite.`); return total; }
    });

    // wages & morale
    const wage = Math.max(0, Math.round(workers * (unlocked["guilds"] ? 0.8 : 1)));
    setMoney(m => Math.max(0, m - wage));
    setMorale(m => clamp(m + (Math.random() > 0.88 ? -3 : Math.random() > 0.6 ? 1 : 0), 10, 100));
  }

  // actions
  function grindManual() {
    if (wheat <= 0) { pushHist("Pas de blé."); return; }
    setWheat(w => w - 1);
    const produced = +(1 * computeMultipliers(unlocked).yieldMult * (weather === "Soleil" ? 1 : weather === "Pluie" ? 0.85 : 0.5)).toFixed(2);
    setFlour(f => +(f + produced).toFixed(2));
    pushHist(`Moulage manuel : +${produced} farine.`);
    saveGame();
  }

  function buyWheat(q=20) {
    const pricePer = unlocked["trade_routes"] ? 0.45 : 0.6;
    const total = Math.ceil(q * pricePer);
    if (money < total) { pushHist("Pas assez d'or."); return; }
    setMoney(m => m - total);
    setWheat(w => w + q);
    pushHist(`Acheté ${q} blé (-${total}🪙).`);
    saveGame();
  }

  function hireWorker() {
    const cost = unlocked["guilds"] ? 24 : 30;
    if (money < cost) { pushHist("Pas assez d'or pour embaucher."); return; }
    setMoney(m => m - cost);
    setWorkers(w => w + 1);
    pushHist("Ouvrier embauché.");
    saveGame();
  }

  function improveMill() {
    const cost = 160;
    if (money < cost) { pushHist("Pas assez d'or."); return; }
    setMoney(m => m - cost);
    setCycleMs(c => Math.max(600, Math.round(c * 0.78)));
    pushHist("Moulin amélioré.");
    saveGame();
  }

  function saveGame() {
    try {
      const state = { wheat, flour, bread, money, workers, morale, cycleMs, timestamp: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      pushHist("Sauvegarde effectuée.");
    } catch (e) { pushHist("Erreur sauvegarde."); }
  }

  function resetGame() {
    if (!confirm("Réinitialiser la partie ?")) return;
    localStorage.removeItem(SAVE_KEY);
    // do not clear tech; user may want tech to persist
    setWheat(220); setFlour(0); setBread(0); setMoney(260); setWorkers(1); setMorale(92); setCycleMs(6000);
    pushHist("Partie réinitialisée.");
  }

  // determine era for visuals: find highest unlocked epoch - simplified mapping:
  function currentEra() {
    const epochOrder = ["Préhistoire","Antiquité","Moyen Âge","Renaissance","Révolution","Moderne","Spatiale"];
    const ids = Object.keys(unlocked);
    const epochs = ids.map(id => { /* map id->epoch roughly */ 
      if (!id) return null;
      if (["hand_tools","fire"].includes(id)) return "Préhistoire";
      if (["wheel_stone","water_mill"].includes(id)) return "Antiquité";
      if (["wheel_iron","guilds"].includes(id)) return "Moyen Âge";
      if (["wind_mill"].includes(id)) return "Renaissance";
      if (["steam_engine","factory_lines"].includes(id)) return "Révolution";
      if (["electric_motors","computing","ai_automation","market_network","trade_routes"].includes(id)) return "Moderne";
      if (["space_mining","fusion_drive","colonies"].includes(id)) return "Spatiale";
      return null;
    }).filter(Boolean);
    for (let i = epochOrder.length - 1; i >= 0; i--) {
      if (epochs.includes(epochOrder[i])) return epochOrder[i];
    }
    return "Préhistoire";
  }

  const era = currentEra();

  // compute worker avatar positions for display
  const workerPositions = Array.from({ length: workers }).map((_, i) => 8 + i * 44);

  /* ----------------------
    RENDER
  -----------------------*/
  return (
    <div className={`page era-${era.toLowerCase().replace(/\s/g,'-')}`}>
      {/* Ambient decorative layers */}
      <div className="ambient">
        {/* subtle particle + vignette */}
        <div className="particles" />
      </div>

      <header className="header">
        <div className="left-brand">
          <div className="logo">🏰</div>
          <div>
            <div className="title">Medieval Mill Master</div>
            <div className="subtitle">{era} — Ambiance renforcée</div>
          </div>
        </div>
        <div className="top-actions">
          <Link href="/technologie"><a className="link-btn">Arbre Technologie</a></Link>
          <button className="btn ghost" onClick={() => { saveGame(); }}>Sauvegarder</button>
          <button className="btn" onClick={() => { pushHist("Aide: ouvriers améliorent la productivité."); }}>?</button>
        </div>
      </header>

      <main className="main">
        <section className="left">
          <div className="card visual-card">
            {/* detailed mill */}
            <div className="mill-area">
              <DetailedMill spinDuration={Math.max(900, cycleMs)} era={era} />
              {/* worker avatars overlaid */}
              <div className="workers">
                {workerPositions.map((x, i) => {
                  const variant = i % 3;
                  return (
                    <div className="worker-wrap" key={i} style={{ left: `${x}px` }}>
                      {variant === 0 && <WorkerSpriteA />}
                      {variant === 1 && <WorkerSpriteB />}
                      {variant === 2 && <WorkerSpriteC />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="info-row">
              <div className="stat">🪙 <strong>{fmt(money)}</strong></div>
              <div className="stat">🌾 <strong>{fmt(wheat)}</strong></div>
              <div className="stat">🥖 <strong>{fmt(bread)}</strong></div>
              <div className="stat">👷 <strong>{workers}</strong></div>
              <div className="stat">⏱ <strong>{(cycleMs/1000).toFixed(1)}s</strong></div>
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
            <p>La farine est transformée automatiquement en pain (4 farine → 1 pain). Le pain est vendu automatiquement.</p>
            <div className="market-controls">
              <button onClick={() => { if (flour >= 1) { setFlour(f => +(f - 1).toFixed(2)); setMoney(m => m + 2); pushHist("Vente manuelle: +2🪙"); saveGame(); } else pushHist("Pas assez de farine."); }}>Vendre 1 farine</button>
              <button className="ghost" onClick={() => { setBread(0); pushHist("Stock pain vidé (debug)"); saveGame(); }}>Vider pain (debug)</button>
            </div>
          </div>
        </section>

        <aside className="right">
          <div className="card mini-tech">
            <h4>Technologies actives</h4>
            <div className="badges">
              <div className={`badge ${unlocked["hand_tools"] ? "on":""}`}>🪨</div>
              <div className={`badge ${unlocked["water_mill"] ? "on":""}`}>💧</div>
              <div className={`badge ${unlocked["wind_mill"] ? "on":""}`}>💨</div>
              <div className={`badge ${unlocked["ai_automation"] ? "on":""}`}>🤖</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href="/technologie"><a className="link">Gérer technologies →</a></Link>
            </div>
          </div>

          <div className="card events">
            <h4>Évènements</h4>
            <div className="current">{notif}</div>
            <ul className="history">
              {history.map((h, idx) => <li key={idx}>{h}</li>)}
            </ul>
            <div style={{ marginTop: 10 }}>
              <label style={{display:'flex', alignItems:'center', gap:8}}><input type="checkbox" readOnly checked /> Autosave</label>
              <div style={{ marginTop:8 }}>
                <button className="ghost" onClick={() => saveGame()}>Sauvegarder</button>
                <button className="ghost" onClick={() => resetGame()}>Réinitialiser</button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">Ambiance renforcée — ouvriers visibles & moulin animé. Pour plus d'assets visuels dis-moi lesquels tu veux (sprites, textures, bruitages).</footer>

      <style jsx>{`
        :root{ --accent:#3367d6; --accent2:#4285f4; --bg1:#07102a; --muted:#cfe3ff; }
        .page { min-height:100vh; background: linear-gradient(180deg,#041226 0%, #071427 60%); color:#eaf6ff; position:relative; overflow:hidden; }
        .ambient .particles { position:absolute; inset:0; background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 40px 40px; opacity:0.05; pointer-events:none; }

        .header { display:flex; justify-content:space-between; align-items:center; padding:14px 22px; max-width:1200px; margin:0 auto; z-index:6; }
        .left-brand { display:flex; gap:12px; align-items:center; }
        .logo { width:46px; height:46px; border-radius:10px; background: linear-gradient(90deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; color:white; font-weight:900; box-shadow:0 12px 36px rgba(51,103,214,0.12); }
        .title { font-weight:900; font-size:1.05rem; }
        .subtitle { color:rgba(255,255,255,0.7); margin-top:3px; font-size:0.9rem; }

        .top-actions { display:flex; gap:10px; align-items:center; }
        .link-btn { padding:8px 10px; border-radius:8px; background: linear-gradient(90deg,var(--accent),var(--accent2)); color:white; text-decoration:none; font-weight:800; }
        .btn { padding:8px 10px; border-radius:8px; background:linear-gradient(90deg,var(--accent),var(--accent2)); border:none; color:white; font-weight:800; cursor:pointer; }
        .btn.ghost { background:transparent; border:1px solid rgba(255,255,255,0.04); color:var(--muted); }

        .main { max-width:1200px; margin:20px auto; display:flex; gap:18px; padding:12px 16px; z-index:6; }
        .left { flex:2; display:flex; flex-direction:column; gap:12px; }
        .right { flex:1; display:flex; flex-direction:column; gap:12px; }

        .card { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.03); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }

        .visual-card .mill-area { position:relative; height:340px; overflow:visible; background: linear-gradient(180deg, rgba(255,255,255,0.005), rgba(255,255,255,0.01)); border-radius:8px; padding:10px; }
        .workers { position:absolute; left:28px; right:28px; bottom:12px; height:88px; pointer-events:none; }
        .worker-wrap { position:absolute; bottom:8px; width:48px; height:64px; transform-origin: center bottom; transition:left 700ms linear; }

        .info-row { display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; color:var(--muted); font-weight:800; }
        .stat { background: rgba(255,255,255,0.02); padding:6px 10px; border-radius:8px; min-width:96px; text-align:center; }

        .controls { display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; }
        .controls button { padding:10px 12px; border-radius:10px; border:none; background: linear-gradient(90deg,var(--accent),var(--accent2)); color:white; font-weight:900; }

        .market .market-controls { display:flex; gap:8px; }

        .mini-tech .badges { display:flex; gap:8px; }
        .badge { background: rgba(255,255,255,0.02); padding:8px; border-radius:8px; font-weight:900; color:var(--muted); }
        .badge.on { background: linear-gradient(90deg,var(--accent),var(--accent2)); color:white; box-shadow: 0 8px 22px rgba(51,103,214,0.12); }

        .events .current { font-weight:900; color:#eaf6ff; margin-bottom:8px; }
        .history { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; max-height:240px; overflow:auto; color:var(--muted); }

        .footer { text-align:center; padding:12px; color:rgba(255,255,255,0.6); margin-top:18px; }

        @media (max-width:980px) {
          .main { flex-direction:column; }
          .workers { left:10px; right:10px; }
        }
      `}</style>
    </div>
  );
}
