import React, { useState, useEffect } from "react";
import Link from "next/link";
//import DetailedMill from "../components/DetailedMill";
//import WorkerSpriteA from "../components/WorkerSpriteA";
//import WorkerSpriteB from "../components/WorkerSpriteB";
//import WorkerSpriteC from "../components/WorkerSpriteC";

export default function Home() {
  // Exemple d'états, adapte selon ton code réel
  const [money, setMoney] = useState(100);
  const [wheat, setWheat] = useState(50);
  const [bread, setBread] = useState(20);
  const [workers, setWorkers] = useState(5);
  const [flour, setFlour] = useState(10);
  const [cycleMs, setCycleMs] = useState(1000);
  const [era, setEra] = useState("Medieval");
  const [notif, setNotif] = useState("Bienvenue !");
  const [history, setHistory] = useState([]);
  const [unlocked, setUnlocked] = useState({
    guilds: false,
    hand_tools: false,
    water_mill: false,
    wind_mill: false,
    ai_automation: false,
  });

  // Positions workers (exemple)
  const workerPositions = [20, 80, 140, 200, 260];

  // Formatage nombre (exemple)
  function fmt(num) {
    return num.toLocaleString();
  }

  // Fonctions d'action simulées
  function saveGame() {
    setNotif("Jeu sauvegardé.");
    pushHist("Sauvegarde effectuée.");
  }

  function pushHist(msg) {
    setHistory((h) => [msg, ...h].slice(0, 50));
  }

  function resetGame() {
    setMoney(100);
    setWheat(50);
    setBread(20);
    setWorkers(5);
    setFlour(10);
    setNotif("Jeu réinitialisé.");
    setHistory([]);
  }

  function grindManual() {
    if (wheat >= 1) {
      setWheat(w => w - 1);
      setFlour(f => f + 1);
      pushHist("Mouture manuelle: +1 farine");
      saveGame();
    } else {
      pushHist("Pas assez de blé pour moudre.");
    }
  }

  function buyWheat(amount) {
    const cost = amount * 2;
    if (money >= cost) {
      setMoney(m => m - cost);
      setWheat(w => w + amount);
      pushHist(`Achat de ${amount} blé (-${cost}🪙)`);
      saveGame();
    } else {
      pushHist("Pas assez d'argent pour acheter du blé.");
    }
  }

  function hireWorker() {
    const cost = unlocked["guilds"] ? 24 : 30;
    if (money >= cost) {
      setMoney(m => m - cost);
      setWorkers(w => w + 1);
      pushHist(`Embauché un ouvrier (-${cost}🪙)`);
      saveGame();
    } else {
      pushHist("Pas assez d'argent pour embaucher.");
    }
  }

  function improveMill() {
    const cost = 160;
    if (money >= cost) {
      setMoney(m => m - cost);
      pushHist("Moulin amélioré (-160🪙)");
      saveGame();
    } else {
      pushHist("Pas assez d'argent pour améliorer le moulin.");
    }
  }

  return (
    <div className={`page era-${era.toLowerCase().replace(/\s/g, "-")}`}>
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
          <button className="btn ghost" onClick={saveGame}>Sauvegarder</button>
          <button className="btn" onClick={() => pushHist("Aide: ouvriers améliorent la productivité.")}>?</button>
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
              <div className="stat">⏱ <strong>{(cycleMs / 1000).toFixed(1)}s</strong></div>
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
              <button
                onClick={() => {
                  if (flour >= 1) {
                    setFlour(f => +(f - 1).toFixed(2));
                    setMoney(m => m + 2);
                    pushHist("Vente manuelle: +2🪙");
                    saveGame();
                  } else pushHist("Pas assez de farine.");
                }}
              >
                Vendre 1 farine
              </button>
              <button
                className="ghost"
                onClick={() => {
                  setBread(0);
                  pushHist("Stock pain vidé (debug)");
                  saveGame();
                }}
              >
                Vider pain (debug)
              </button>
            </div>
          </div>
        </section>

        <aside className="right">
          <div className="card mini-tech">
            <h4>Technologies actives</h4>
            <div className="badges">
              <div className={`badge ${unlocked["hand_tools"] ? "on" : ""}`}>🪨</div>
              <div className={`badge ${unlocked["water_mill"] ? "on" : ""}`}>💧</div>
              <div className={`badge ${unlocked["wind_mill"] ? "on" : ""}`}>💨</div>
              <div className={`badge ${unlocked["ai_automation"] ? "on" : ""}`}>🤖</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href="/technologie"><a className="link">Gérer technologies →</a></Link>
            </div>
          </div>

          <div className="card events">
            <h4>Évènements</h4>
            <div className="current">{notif}</div>
            <ul className="history">
              {history.map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" readOnly checked /> Autosave
              </label>
              <div style={{ marginTop: 8 }}>
                <button className="ghost" onClick={saveGame}>Sauvegarder</button>
                <button className="ghost" onClick={resetGame}>Réinitialiser</button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">
        Ambiance renforcée — ouvriers visibles & moulin animé. Pour plus d'assets visuels dis-moi lesquels tu veux (sprites, textures, bruitages).
      </footer>

      <style jsx>{`
        :root {
          --accent: #3367d6;
          --accent2: #4285f4;
          --bg1: #07102a;
          --muted: #cfe3ff;
        }
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #041226 0%, #071427 60%);
          color: #eaf6ff;
          position: relative;
          overflow: hidden;
        }
        .ambient .particles {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.05;
          pointer-events: none;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 22px;
          max-width: 1200px;
          margin: 0 auto;
          z-index: 6;
        }
        .left-brand {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .logo {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          box-shadow: 0 12px 36px rgba(51, 103, 214, 0.12);
        }
        .title {
          font-weight: 900;
          font-size: 1.05rem;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-top: 3px;
          font-size: 0.9rem;
        }

        .top-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .link-btn {
          background: var(--accent);
          padding: 8px 14px;
          color: white;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 5px 15px rgba(51, 103, 214, 0.45);
          transition: background 0.3s;
        }
        .link-btn:hover {
          background: var(--accent2);
        }

        .btn {
          background: var(--accent2);
          border: none;
          color: white;
          font-weight: 700;
          border-radius: 8px;
          padding: 6px 14px;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(66, 133, 244, 0.5);
          transition: background 0.3s;
        }
        .btn:hover {
          background: var(--accent);
        }
        .btn.ghost {
          background: transparent;
          color: var(--accent);
          border: 1.5px solid var(--accent);
          box-shadow: none;
        }
        .btn.ghost:hover {
          background: var(--accent);
          color: white;
          box-shadow: 0 5px 15px rgba(51, 103, 214, 0.5);
        }

        .main {
          display: flex;
          max-width: 1200px;
          margin: 30px auto 60px;
          gap: 28px;
          padding: 0 16px;
          z-index: 5;
        }
        .left {
          flex: 1 1 66%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .right {
          flex: 1 1 32%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card {
          background: linear-gradient(90deg, #0a1d3c 0%, #071229 100%);
          border-radius: 18px;
          box-shadow: 0 12px 50px rgba(51, 103, 214, 0.45);
          padding: 16px 18px;
          color: white;
          font-size: 0.95rem;
          user-select: none;
        }

        .visual-card {
          position: relative;
          padding: 20px;
          text-align: center;
        }
        .mill-area {
          position: relative;
          height: 240px;
          margin-bottom: 8px;
        }
        .workers {
          position: absolute;
          bottom: 10px;
          left: 0;
          width: 100%;
          height: 90px;
          pointer-events: none;
        }
        .worker-wrap {
          position: absolute;
          bottom: 0;
          user-select: none;
          transform-origin: center bottom;
          animation: floaty 3s ease-in-out infinite;
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .info-row {
          display: flex;
          justify-content: space-around;
          margin-top: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 1.12rem;
        }
        .stat {
          padding: 4px 12px;
          background: rgba(0,0,0,0.15);
          border-radius: 14px;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
          user-select: none;
        }

        .controls {
          margin-top: 14px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .controls button {
          flex: 1 1 120px;
          border-radius: 12px;
          padding: 8px 12px;
          font-weight: 700;
          background: var(--accent2);
          color: white;
          border: none;
          cursor: pointer;
          transition: background 0.3s;
          box-shadow: 0 6px 18px rgba(66, 133, 244, 0.5);
        }
        .controls button:hover {
          background: var(--accent);
        }

        .market {
          text-align: center;
        }
        .market-controls button {
          margin: 6px 4px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          background: var(--accent);
          color: white;
          box-shadow: 0 5px 15px rgba(51, 103, 214, 0.6);
          transition: background 0.3s;
        }
        .market-controls button.ghost {
          background: transparent;
          border: 1.5px solid var(--accent);
          color: var(--accent);
          box-shadow: none;
        }
        .market-controls button:hover {
          background: var(--accent2);
          color: white;
          box-shadow: 0 5px 20px rgba(66, 133, 244, 0.7);
        }

        .mini-tech .badges {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .mini-tech .badge {
          font-size: 1.7rem;
          filter: grayscale(100%);
          opacity: 0.5;
          transition: all 0.4s;
          user-select: none;
        }
        .mini-tech .badge.on {
          filter: none;
          opacity: 1;
          text-shadow: 0 0 8px var(--accent2);
        }

        .events .history {
          max-height: 170px;
          overflow-y: auto;
          margin-top: 8px;
          padding-left: 16px;
          list-style-type: disc;
          font-size: 0.9rem;
          color: var(--muted);
        }

        .footer {
          text-align: center;
          color: var(--muted);
          font-size: 0.9rem;
          padding: 18px 10px;
          max-width: 1200px;
          margin: 0 auto 28px;
          user-select: none;
        }

        @media (max-width: 980px) {
          .main {
            flex-direction: column;
          }
          .left, .right {
            flex: 1 1 auto;
            width: 100%;
          }
          .controls button {
            flex: 1 1 100%;
          }
          .top-actions {
            flex-wrap: wrap;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}

