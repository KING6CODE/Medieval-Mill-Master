// pages/index.js
import { useEffect, useRef, useState } from "react";

/**
 * Medieval Mill Master - page unique
 * - Thème sombre, boutons lisibles
 * - Tutoriel interactif (localStorage)
 * - Animations météo (sun / rain / drought)
 * - Production cycle (blé -> farine -> pain -> vente)
 * - Autosave & notifications
 *
 * Remarque : le style est en styled-jsx pour garder un seul fichier.
 */

// clé localStorage
const SAVE_KEY = "mm_master_full_v2";
const TUTO_KEY = "mm_master_tuto_v2";

/* ---------------------------
   Helper utilities
   --------------------------- */
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function fmt(n) {
  if (n >= 1000000) return `${Math.round(n / 100000) / 10} M`;
  if (n >= 1000) return `${Math.round(n / 100) / 10} k`;
  return Math.floor(n);
}

/* ---------------------------
   WeatherAnimation Component
   - renders different animated backgrounds depending on current weather
   --------------------------- */
function WeatherAnimation({ weather }) {
  // weather: "Soleil" | "Pluie" | "Sécheresse"
  return (
    <div className={`weather-wrap ${weather.toLowerCase()}`} aria-hidden>
      {/* Sun */}
      <div className="sun" />
      {/* Clouds (used for rain / sun partly) */}
      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      {/* Rain */}
      <div className="rain">
        {Array.from({ length: 18 }).map((_, i) => (
          <div className="drop" key={i} style={{ left: `${i * 5 + (i % 3)}%`, animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      {/* Drought cracked ground */}
      <div className="cracks">
        <svg viewBox="0 0 200 80" preserveAspectRatio="none">
          <path d="M0,60 L40,35 L80,60 L120,20 L160,45 L200,10" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <style jsx>{`
        .weather-wrap {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: opacity 0.6s ease;
        }
        .weather-wrap .sun {
          position: absolute;
          top: 16%;
          right: 12%;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff9c4 0%, #ffd54f 30%, #ffb300 60%);
          box-shadow: 0 0 60px rgba(255,200,50,0.25), 0 10px 30px rgba(0,0,0,0.15);
          transform: translateY(0);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .cloud {
          position: absolute;
          top: 10%;
          left: 8%;
          width: 240px;
          height: 64px;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
          border-radius: 40px;
          box-shadow: 0 18px 60px rgba(2,6,23,0.4) inset;
          opacity: 0.9;
          transform: translateX(0);
          animation: cloudMove 20s linear infinite;
        }
        .cloud.cloud-2 {
          top: 24%;
          left: 40%;
          width: 320px;
          height: 88px;
          animation-duration: 28s;
          opacity: 0.85;
        }
        @keyframes cloudMove {
          0% { transform: translateX(-6%); }
          50% { transform: translateX(6%); }
          100% { transform: translateX(-6%); }
        }

        .rain { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.6s ease; }
        .drop {
          position: absolute;
          top: 12%;
          width: 2px;
          height: 26px;
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.2));
          border-radius: 2px;
          transform: translateY(-10vh);
          animation: fall 900ms linear infinite;
        }
        @keyframes fall {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(90vh); opacity: 0; }
        }

        .cracks { position: absolute; bottom: 5%; left: 6%; width: 88%; height: 30%; opacity: 0; transition: opacity 0.6s ease; }
        .cracks svg { width: 100%; height: 100%; display: block; }

        /* weather states */
        .weather-wrap.soleil .sun { opacity: 1; transform: translateY(0); }
        .weather-wrap.soleil .rain { opacity: 0; }
        .weather-wrap.soleil .cracks { opacity: 0; }

        .weather-wrap.pluie .sun { opacity: 0.25; transform: translateY(-10px) scale(0.9); }
        .weather-wrap.pluie .rain { opacity: 1; }
        .weather-wrap.pluie .cracks { opacity: 0; }

        .weather-wrap.sécheresse .sun { opacity: 0.9; transform: translateY(-6px); filter: saturate(0.9) brightness(1.05); }
        .weather-wrap.sécheresse .rain { opacity: 0; }
        .weather-wrap.sécheresse .cracks { opacity: 1; transform: translateY(6px); }
      `}</style>
    </div>
  );
}

/* ---------------------------
   Tutorial Component
   - multi-step overlay tutorial
   --------------------------- */
function Tutorial({ onClose, step, setStep }) {
  const steps = [
    {
      title: "Bienvenue, Maître Meunier",
      text: "Tu hérites d'un petit moulin. Nous allons moudre du blé, produire de la farine, et vendre du pain.",
      hint: "Clique sur le bouton 'Moudre' pour lancer une production manuelle."
    },
    {
      title: "Vente & Or",
      text: "La farine se transforme en pain automatiquement puis est vendue. L'or te permet d'acheter ressources et améliorations.",
      hint: "Vends manuellement si nécessaire."
    },
    {
      title: "Météo",
      text: "La météo change et influence les rendements (Soleil > Pluie > Sécheresse).",
      hint: "Observe la zone météo en haut à droite."
    },
    {
      title: "Recherche",
      text: "Investis dans la recherche (moulin à vent) pour accélérer ta production.",
      hint: "Le bouton Recherche se trouve dans le panneau de droite."
    },
    {
      title: "Bon jeu !",
      text: "Tu es prêt. Gère ton moulin avec sagesse et fais prospérer ton empire.",
      hint: "Tu peux réouvrir ce tutoriel depuis le panneau 'Aide'."
    }
  ];

  const current = steps[step] || steps[0];

  function next() {
    if (step >= steps.length - 1) {
      localStorage.setItem(TUTO_KEY, "done");
      onClose();
    } else {
      setStep(step + 1);
    }
  }
  function prev() {
    setStep(Math.max(0, step - 1));
  }

  return (
    <div className="tuto-overlay" role="dialog" aria-modal="true">
      <div className="tuto-card">
        <h3>{current.title}</h3>
        <p>{current.text}</p>
        <div className="hint">{current.hint}</div>
        <div className="tuto-controls">
          <button className="ghost" onClick={prev} disabled={step === 0}>Précédent</button>
          <button onClick={next}>{step >= steps.length - 1 ? "Terminer" : "Suivant"}</button>
        </div>
      </div>

      <style jsx>{`
        .tuto-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 28px;
          pointer-events: auto;
          z-index: 1200;
        }
        .tuto-card {
          width: min(680px, 96%);
          background: linear-gradient(180deg, rgba(6,12,30,0.9), rgba(8,18,36,0.95));
          border: 1px solid rgba(255,255,255,0.04);
          padding: 20px 22px;
          border-radius: 12px;
          box-shadow: 0 18px 50px rgba(2,8,22,0.6);
          color: #f5f7fb;
        }
        .tuto-card h3 { margin: 0 0 8px 0; color: #fff; font-size: 1.2rem; }
        .tuto-card p { margin: 0 0 10px 0; color: #dbe6ff; line-height: 1.4; }
        .hint { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; color: #bcd0ff; font-size: 0.95rem; margin-bottom: 12px; }
        .tuto-controls { display:flex; gap:10px; justify-content:flex-end; }
        .tuto-controls button { padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer; font-weight:700; }
        .tuto-controls .ghost { background: transparent; color: #bcd0ff; border: 1px solid rgba(255,255,255,0.04); }
        .tuto-controls button:not(.ghost) { background: linear-gradient(90deg,#3367d6,#4285f4); color: white; box-shadow: 0 8px 20px rgba(50,100,255,0.12); }
      `}</style>
    </div>
  );
}

/* ---------------------------
   Main Page
   --------------------------- */
export default function Home() {
  // core resources
  const [wheat, setWheat] = useState(120); // unité de blé
  const [flour, setFlour] = useState(0); // farine (peut être float)
  const [bread, setBread] = useState(0); // pain
  const [money, setMoney] = useState(120); // pièces

  // production mechanics
  const [cycleMs, setCycleMs] = useState(6000); // durée d'un cycle
  const [working, setWorking] = useState(false);
  const workingRef = useRef(false);

  // workforce / morale
  const [workers, setWorkers] = useState(1);
  const [morale, setMorale] = useState(92); // 0-100

  // tech
  const [hasWindMill, setHasWindMill] = useState(false);
  const [researching, setResearching] = useState(false);

  // weather & events
  const [weather, setWeather] = useState("Soleil");
  // impact multipliers
  const weatherMultipliers = { Soleil: 1.0, Pluie: 0.85, Sécheresse: 0.5 };

  // tutorial
  const [showTuto, setShowTuto] = useState(false);
  const [tutoStep, setTutoStep] = useState(0);

  // notifications
  const [notif, setNotif] = useState("Bienvenue au moulin !");
  const [notifHistory, setNotifHistory] = useState([]);

  // autosave
  const [autosave, setAutosave] = useState(true);

  // mount: load save and tutorial state
  useEffect(() => {
    // load save
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setWheat(s.wheat ?? 120);
        setFlour(s.flour ?? 0);
        setBread(s.bread ?? 0);
        setMoney(s.money ?? 120);
        setCycleMs(s.cycleMs ?? 6000);
        setWorkers(s.workers ?? 1);
        setMorale(s.morale ?? 92);
        setHasWindMill(s.hasWindMill ?? false);
        setNotif("Partie chargée.");
        pushNotif("Sauvegarde chargée.");
      } else {
        setNotif("Nouvelle partie : bienvenue !");
        pushNotif("Nouvelle partie initialisée.");
      }
    } catch (e) {
      console.error("Load failed", e);
      setNotif("Erreur de chargement.");
    }

    // tutorial
    const done = localStorage.getItem(TUTO_KEY);
    if (!done) {
      setShowTuto(true);
      setTutoStep(0);
    } else {
      setShowTuto(false);
    }
  }, []);

  // push notif helper
  function pushNotif(msg) {
    const stamp = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${msg}`;
    setNotif(msg);
    setNotifHistory((h) => [stamp, ...h].slice(0, 40));
  }

  // autosave effect
  useEffect(() => {
    if (!autosave) return;
    const id = setInterval(() => {
      saveGame();
    }, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheat, flour, bread, money, cycleMs, workers, morale, hasWindMill, autosave]);

  function saveGame() {
    try {
      const state = {
        wheat, flour, bread, money, cycleMs, workers, morale, hasWindMill, timestamp: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      pushNotif("Jeu sauvegardé.");
    } catch (e) {
      console.error("Save failed", e);
      pushNotif("Erreur sauvegarde.");
    }
  }

  function resetGame() {
    if (!confirm("Réinitialiser la partie et effacer la sauvegarde ?")) return;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(TUTO_KEY);
    setWheat(120);
    setFlour(0);
    setBread(0);
    setMoney(120);
    setCycleMs(6000);
    setWorkers(1);
    setMorale(92);
    setHasWindMill(false);
    setNotif("Partie réinitialisée.");
    setNotifHistory([]);
  }

  // weather auto-change
  useEffect(() => {
    const types = ["Soleil", "Pluie", "Sécheresse"];
    const id = setInterval(() => {
      const r = Math.random();
      if (r < 0.6) setWeather("Soleil");
      else if (r < 0.9) setWeather("Pluie");
      else setWeather("Sécheresse");
      pushNotif("Météo mise à jour.");
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // production loop (if not automated by worker robots)
  useEffect(() => {
    // we will start an interval that triggers production every cycleMs
    let id = null;
    if (!workingRef.current) {
      id = setInterval(() => {
        runProductionCycle();
      }, cycleMs);
      // mark that automatic loop runs
      workingRef.current = true;
      setWorking(true);
    }
    // cleanup on change of cycleMs or unmount
    return () => {
      if (id) clearInterval(id);
      workingRef.current = false;
      setWorking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleMs, weather, workers, morale, hasWindMill]);

  // production logic
  function runProductionCycle() {
    // each cycle consumes wheat depending on workers
    const consumption = Math.max(1, workers);
    if (wheat <= 0) {
      pushNotif("Plus de blé — achète ou cultive du blé !");
      return;
    }
    const actualConsume = Math.min(wheat, consumption);
    setWheat((w) => Math.max(0, w - actualConsume));

    // compute produced flour
    const base = actualConsume * (hasWindMill ? 1.4 : 1.0);
    const weatherMultiplier = weatherMultipliers[weather] ?? 1;
    // morale adds some gain (0..10%)
    const moraleBonus = 1 + (clamp(morale, 0, 100) / 1000);
    const producedFlour = +(base * weatherMultiplier * moraleBonus).toFixed(2);

    setFlour((f) => +(f + producedFlour).toFixed(2));

    // convert flour -> bread: 4 flour -> 1 bread automatically (as much as possible)
    setFlour((f) => {
      const totalFlour = +(f + producedFlour).toFixed(2);
      const possibleBread = Math.floor(totalFlour / 4);
      if (possibleBread > 0) {
        setBread((b) => b + possibleBread);
        const leftover = +(totalFlour - possibleBread * 4).toFixed(2);
        // auto-sell bread immediately for simplicity
        setMoney((m) => m + possibleBread * 10);
        pushNotif(`Cycle: ${producedFlour} farine → ${possibleBread} pain vendus (+${possibleBread * 10}🪙)`);
        return leftover;
      } else {
        pushNotif(`Cycle: ${producedFlour} farine produite.`);
        return totalFlour;
      }
    });

    // pay wages
    const wagePerWorker = 1; // per cycle
    const totalWages = workers * wagePerWorker;
    setMoney((m) => Math.max(0, m - totalWages));
    // morale slightly changes randomly
    setMorale((old) => clamp(old + (Math.random() > 0.88 ? -4 : Math.random() > 0.6 ? 1 : 0), 10, 100));
  }

  // user actions
  function grindManual() {
    // manual immediate grind: consume 1 wheat
    if (wheat <= 0) {
      pushNotif("Tu n'as pas de blé à moudre !");
      return;
    }
    setWheat((w) => w - 1);
    const produced = +(1 * (hasWindMill ? 1.4 : 1.0) * (weatherMultipliers[weather]) ).toFixed(2);
    setFlour((f) => +(f + produced).toFixed(2));
    pushNotif(`Moulage manuel : +${produced} farine.`);
  }

  function buyWheat(qty = 20) {
    const pricePer = 0.6;
    const total = Math.ceil(qty * pricePer);
    if (money < total) {
      pushNotif("Pas assez d'argent pour acheter du blé.");
      return;
    }
    setMoney((m) => m - total);
    setWheat((w) => w + qty);
    pushNotif(`Acheté ${qty} blé pour ${total}🪙.`);
  }

  function hireWorker() {
    const cost = 30;
    if (money < cost) { pushNotif("Pas assez d'argent pour embaucher."); return; }
    setMoney((m) => m - cost);
    setWorkers((w) => w + 1);
    pushNotif("Un ouvrier embauché.");
  }

  function improveMill() {
    const cost = 120;
    if (money < cost) { pushNotif("Pas assez d'argent pour améliorer le moulin."); return; }
    if (cycleMs <= 1200) { pushNotif("Le moulin est déjà très performant."); return; }
    setMoney((m) => m - cost);
    // reduce cycle by 20% but not below 1200ms
    setCycleMs((c) => Math.max(1200, Math.round(c * 0.8)));
    pushNotif("Amélioration : moulin plus rapide.");
  }

  function startResearchWindmill() {
    if (hasWindMill) { pushNotif("Moulin à vent déjà débloqué."); return; }
    if (researching) { pushNotif("Recherche déjà en cours."); return; }
    const cost = 300;
    if (money < cost) { pushNotif("Pas assez d'argent pour la recherche (300)."); return; }
    setMoney((m) => m - cost);
    setResearching(true);
    pushNotif("Recherche moulin à vent lancée (20s).");
    setTimeout(() => {
      setHasWindMill(true);
      setResearching(false);
      // reward: reduce cycle by a chunk
      setCycleMs((c) => Math.max(900, Math.round(c * 0.7)));
      pushNotif("Technologie moulin à vent débloquée !");
    }, 20000);
  }

  // reopen tutorial manually
  function openTuto() {
    setShowTuto(true);
    setTutoStep(0);
    localStorage.removeItem(TUTO_KEY);
  }

  /* ---------------------------
     UI Rendering
     --------------------------- */
  return (
    <div className="page-root">
      {/* animated weather background */}
      <WeatherAnimation weather={weather} />

      <header className="header">
        <div className="brand">
          <div className="logo">🏠</div>
          <div>
            <div className="title">Medieval Mill Master</div>
            <div className="subtitle">De la pierre au cosmos — prototype</div>
          </div>
        </div>

        <div className="top-right">
          <div className="small-stat">🪙 {fmt(money)}</div>
          <div className="small-stat">🌾 {fmt(wheat)}</div>
          <div className="small-stat">🥖 {fmt(bread)}</div>
          <div className="small-stat">👷 {workers}</div>
          <div className="help">
            <button className="icon-btn" onClick={openTuto} aria-label="Ouvrir le tutoriel">❓</button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="left-col">
          <div className="card mill-card" role="region" aria-label="Moulin principal">
            <div className="card-header">
              <h2>Moulin principal</h2>
              <div className="subtext">Cycle : {(cycleMs/1000).toFixed(1)}s • Météo : {weather}</div>
            </div>

            <div className="mill-body">
              <div className={`mill-visual ${workingRef.current ? "active" : ""}`}>
                <div className="wheel" style={{ animationDuration: `${Math.max(900, cycleMs)}ms` }} />
                <div className="mill-house" />
              </div>

              <div className="meter">
                <div className="meter-row">
                  <div>Blé</div><div className="meter-value">{fmt(wheat)}</div>
                </div>
                <div className="meter-row">
                  <div>Farine</div><div className="meter-value">{flour.toFixed(2)}</div>
                </div>
                <div className="meter-row">
                  <div>Pain (vendu auto)</div><div className="meter-value">{fmt(bread)}</div>
                </div>
                <div className="meter-row">
                  <div>Morale</div><div className="meter-value">{morale}%</div>
                </div>
              </div>
            </div>

            <div className="controls">
              <button onClick={grindManual}>Moudre (manuel)</button>
              <button onClick={() => buyWheat(20)}>Acheter 20 blé</button>
              <button onClick={hireWorker}>Embaucher (-30🪙)</button>
              <button onClick={improveMill}>Améliorer (-120🪙)</button>
            </div>
          </div>

          <div className="card bakery-card">
            <h3>Atelier & Vente</h3>
            <p>La farine est convertie en pain automatiquement (4 farine → 1 pain). Le pain est vendu immédiatement pour 10🪙 l'unité.</p>
            <div className="mini-stats">
              <div>Farine restante : <strong>{flour.toFixed(2)}</strong></div>
              <div>Pain stocké : <strong>{bread}</strong></div>
            </div>
            <div className="controls small">
              <button onClick={() => {
                if (flour >= 1) {
                  setFlour((f) => Math.max(0, +(f - 1).toFixed(2)));
                  setMoney((m) => m + 2);
                  pushNotif("Vente manuelle : -1 farine = +2🪙");
                } else pushNotif("Pas assez de farine pour vendre !");
              }}>Vendre 1 farine (+2🪙)</button>
              <button onClick={() => { setBread(0); pushNotif("Vente tout : manuelle"); }}>Vider pain (démo)</button>
            </div>
          </div>
        </section>

        <aside className="right-col">
          <div className="card tech-card">
            <h3>Arbre technologique</h3>
            <div className="tech-item">
              <div className={`icon ${hasWindMill ? "on" : ""}`}>💨</div>
              <div className="tech-body">
                <strong>Moulin à vent</strong>
                <div className="desc">Augmente la productivité et réduit les temps de cycle.</div>
              </div>
              <div className="tech-action">
                <button onClick={startResearchWindmill} disabled={hasWindMill || researching}>
                  {hasWindMill ? "Débloqué" : researching ? "Recherche..." : "Rechercher (300🪙)"}
                </button>
              </div>
            </div>
          </div>

          <div className="card events-card">
            <h3>Événements & météo</h3>
            <div className="event-row">
              <div className={`badge ${weather.toLowerCase()}`}>{weather}</div>
              <div className="event-desc">La météo influence la production : <em>Soleil &gt; Pluie &gt; Sécheresse</em>.</div>
            </div>
            <div className="controls small">
              <button onClick={() => { setWeather("Soleil"); pushNotif("Météo : Soleil forcé"); }}>Forcer Soleil</button>
              <button onClick={() => { setWeather("Pluie"); pushNotif("Météo : Pluie forcée"); }}>Forcer Pluie</button>
              <button onClick={() => { setWeather("Sécheresse"); pushNotif("Météo : Sécheresse forcée"); }}>Forcer Sécheresse</button>
            </div>
          </div>

          <div className="card info-card">
            <h3>Notifications</h3>
            <div className="notif-area" aria-live="polite">
              <div className="current">{notif}</div>
              <ul className="history">
                {notifHistory.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>

            <div className="controls small" style={{ marginTop: 10 }}>
              <label className="row">
                <input type="checkbox" checked={autosave} onChange={() => setAutosave(!autosave)} />
                Autosave (6s)
              </label>
              <div className="row">
                <button onClick={saveGame}>Sauvegarder</button>
                <button className="ghost" onClick={resetGame}>Réinitialiser</button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">
        Prototype — Demo jouable · Sauvegarde locale · Conçu pour extension
      </footer>

      {/* tutorial overlay */}
      {showTuto && <Tutorial onClose={() => setShowTuto(false)} step={tutoStep} setStep={setTutoStep} />}

      <style jsx>{`
        :root {
          --bg1: #081027;
          --bg2: #0c172a;
          --card: rgba(8,12,36,0.64);
          --muted: #b8c7ff;
          --accent: #3367d6;
          --accent2: #4285f4;
        }
        .page-root { min-height: 100vh; background: linear-gradient(180deg, #07102a 0%, #07182b 60%); color: #f3f6ff; position: relative; overflow: hidden; }
        /* header */
        .header { display:flex; justify-content:space-between; align-items:center; padding:16px 28px; position:relative; z-index:10; }
        .brand { display:flex; gap:12px; align-items:center; }
        .logo { width:44px; height:44px; background: linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 28px rgba(50,100,255,0.12); font-size:20px; }
        .title { font-weight:800; font-size:1.05rem; color: #fff; }
        .subtitle { font-size:0.85rem; color: rgba(255,255,255,0.66); margin-top:2px; }

        .top-right { display:flex; gap:12px; align-items:center; }
        .small-stat { background: rgba(255,255,255,0.03); padding:8px 12px; border-radius:10px; font-weight:700; color:var(--muted); min-width:62px; text-align:center; }
        .help .icon-btn { background: transparent; border: 1px solid rgba(255,255,255,0.04); color: #f7fbff; padding:8px; border-radius:8px; cursor:pointer; }

        /* main layout */
        .main { display:flex; gap:18px; padding:20px 28px; width:100%; max-width:1200px; margin:0 auto; box-sizing:border-box; align-items:flex-start; z-index: 5; position:relative; }
        .left-col { flex: 2; display:flex; flex-direction:column; gap:16px; }
        .right-col { flex: 1; display:flex; flex-direction:column; gap:12px; }

        .card { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:12px; padding:16px; border:1px solid rgba(255,255,255,0.03); box-shadow: 0 8px 30px rgba(3,6,20,0.5); }
        .card-header { display:flex; justify-content:space-between; align-items:center; }
        h2, h3 { margin:0; color:#fff; }
        .subtext { color: rgba(255,255,255,0.6); font-size:0.9rem; }

        /* mill visual */
        .mill-body { display:flex; gap:18px; align-items:center; padding:12px 0; }
        .mill-visual { width:220px; height:160px; position:relative; display:flex; align-items:center; justify-content:center; }
        .wheel { width:120px; height:120px; border-radius:50%; border:12px solid var(--accent); border-top-color: transparent; box-shadow: inset 0 6px 26px rgba(0,0,0,0.35); transform-origin:center; }
        .wheel { animation: spin 4s linear infinite paused; }
        .mill-visual.active .wheel { animation-play-state: running; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .mill-house { width:120px; height:88px; background: linear-gradient(180deg,var(--accent),var(--accent2)); border-radius:8px; box-shadow: inset 0 -12px 36px rgba(0,0,0,0.14); transform: translateY(-18px); }

        .meter { width:100%; display:flex; flex-direction:column; gap:8px; color: var(--muted); margin-left: 8px; }
        .meter-row { display:flex; justify-content:space-between; font-weight:600; }

        .controls { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
        .controls.small { display:flex; gap:8px; flex-wrap:wrap; }

        button { background: linear-gradient(90deg,var(--accent),var(--accent2)); border: none; color: white; padding:10px 14px; border-radius:10px; font-weight:800; cursor:pointer; box-shadow: 0 12px 30px rgba(51,103,214,0.12); transition: transform 0.12s ease, box-shadow 0.12s ease; }
        button:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(51,103,214,0.18); }
        button.ghost { background: transparent; color: var(--muted); border: 1px solid rgba(255,255,255,0.04); box-shadow:none; }

        /* tech item */
        .tech-item { display:flex; gap:12px; align-items:center; }
        .icon { width:46px; height:46px; border-radius:10px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.02); font-size:18px; }
        .icon.on { background: linear-gradient(90deg,var(--accent),var(--accent2)); color: white; box-shadow: 0 8px 22px rgba(51,103,214,0.12); }
        .tech-body { flex:1; color: var(--muted); }
        .tech-action button { padding:8px 10px; border-radius:8px; }

        /* events */
        .event-row { display:flex; gap:10px; align-items:center; }
        .badge { padding:8px 10px; border-radius:8px; font-weight:800; color: white; }
        .badge.soleil { background: #f4b400; color: #1b1400; }
        .badge.pluie { background: var(--accent2); }
        .badge.sécheresse { background: #d95b3b; }

        /* info / notifications */
        .notif-area { min-height:110px; max-height:220px; overflow:auto; color: var(--muted); }
        .notif-area .current { font-weight:700; color: #eaf0ff; margin-bottom:8px; }
        .history { list-style: none; padding: 0; margin: 0; display:flex; flex-direction:column; gap:6px; }
        .history li { font-size:0.85rem; opacity:0.85; }

        /* footer */
        .footer { padding: 12px 20px; text-align:center; color: rgba(255,255,255,0.6); margin-top: 22px; border-top: 1px solid rgba(255,255,255,0.02); }

        /* responsive */
        @media (max-width: 980px) {
          .main { flex-direction: column; padding: 18px; }
          .mill-visual { width:160px; height:120px; }
        }
      `}</style>
    </div>
  );
}


