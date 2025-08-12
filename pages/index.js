import { useEffect, useRef, useState } from "react";

const SAVE_KEY = "mm_master_save_v1";

export default function Home() {
  // --- Ressources / Stats
  const [ble, setBle] = useState(120); // céréales
  const [farine, setFarine] = useState(0);
  const [pain, setPain] = useState(0);
  const [argent, setArgent] = useState(80);

  // --- Production
  const [vitesseProdMs, setVitesseProdMs] = useState(6000); // durée cycle (ms)
  const [enProduction, setEnProduction] = useState(false);
  const productionRef = useRef(null);

  // --- Personnel
  const [ouvriers, setOuvriers] = useState(1);
  const salaireOuvrier = 2; // par cycle
  const [morale, setMorale] = useState(100); // 0-100

  // --- Tech simple
  const [techMoulinVent, setTechMoulinVent] = useState(false);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  // --- Météo & événements
  const [meteo, setMeteo] = useState("Soleil"); // "Soleil"|"Pluie"|"Sécheresse"
  const meteoImpact = { Soleil: 1, Pluie: 0.85, Sécheresse: 0.5 };
  const [notif, setNotif] = useState("Bienvenue, meunier !");

  // --- Autosave
  const [autosaveOn, setAutosaveOn] = useState(true);

  // --- Chargement depuis localStorage au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setBle(s.ble ?? 120);
        setFarine(s.farine ?? 0);
        setPain(s.pain ?? 0);
        setArgent(s.argent ?? 80);
        setVitesseProdMs(s.vitesseProdMs ?? 6000);
        setOuvriers(s.ouvriers ?? 1);
        setMorale(s.morale ?? 100);
        setTechMoulinVent(s.techMoulinVent ?? false);
        setNotif("Partie chargée depuis la sauvegarde.");
      } else {
        setNotif("Nouvelle partie — bonne chance !");
      }
    } catch (e) {
      console.error("Erreur chargement sauvegarde", e);
    }
  }, []);

  // --- Sauvegarde automatique
  useEffect(() => {
    if (!autosaveOn) return;
    const interval = setInterval(() => {
      saveGame();
    }, 5000);
    return () => clearInterval(interval);
  }, [ble, farine, pain, argent, vitesseProdMs, ouvriers, morale, techMoulinVent, autosaveOn]);

  function saveGame() {
    try {
      const state = {
        ble, farine, pain, argent,
        vitesseProdMs, ouvriers, morale, techMoulinVent,
        timestamp: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setNotif("Sauvegarde automatique enregistrée.");
    } catch (e) {
      console.error("Impossible de sauvegarder", e);
      setNotif("Erreur : sauvegarde impossible.");
    }
  }

  function resetGame() {
    if (!confirm("Réinitialiser la partie ?")) return;
    setBle(120);
    setFarine(0);
    setPain(0);
    setArgent(80);
    setVitesseProdMs(6000);
    setOuvriers(1);
    setMorale(100);
    setTechMoulinVent(false);
    localStorage.removeItem(SAVE_KEY);
    setNotif("Partie réinitialisée.");
  }

  // --- Production cycle (blé -> farine -> pain -> vente automatique)
  useEffect(() => {
    if (enProduction) return;
    // Check ressources
    const consomm = Math.max(1, ouvriers); // blé par cycle
    if (ble < consomm) {
      setNotif("Pas assez de blé pour lancer une production.");
      return;
    }
    setEnProduction(true);
    productionRef.current = setTimeout(() => {
      // Consommation
      const bléConsommé = consomm;
      setBle((b) => Math.max(0, b - bléConsommé));

      // Production farine (influencé par météo et morale)
      const baseFarine = Math.floor(ouvriers * meteoImpact[meteo] * (0.8 + (morale / 200)));
      const farineProduite = Math.max(0, baseFarine);

      // Convertir une partie de farine en pain (si on a four/pain automatique)
      // Ici : simple règle - si farine >= 3, forger pain automatiquement
      setFarine((f) => {
        const newF = f + farineProduite;
        // transformation automatique : 3 farine -> 1 pain
        const possiblePain = Math.floor(newF / 3);
        if (possiblePain > 0) {
          const convert = possiblePain; // convert all possible
          setPain((p) => p + convert);
          const reste = newF - convert * 3;
          return reste;
        }
        return newF;
      });

      // Vente automatique : chaque pain vendu = 8 pièces
      setPain((p) => {
        const vendu = p; // on vend tout produit
        if (vendu > 0) {
          const gain = vendu * 8;
          setArgent((a) => a + gain);
          setNotif(`Cycle terminé : ${farineProduite} farine → ${vendu} pain vendus (+${gain}🪙).`);
          return 0;
        } else {
          setNotif(`Cycle terminé : ${farineProduite} farine produite.`);
          return p;
        }
      });

      // Salaire des ouvriers
      const salaireTotal = ouvriers * salaireOuvrier;
      setArgent((a) => Math.max(0, a - salaireTotal));

      // légère variation morale
      setMorale((m) => Math.max(0, Math.min(100, m + (Math.random() > 0.85 ? -5 : 1))));

      setEnProduction(false);
    }, vitesseProdMs);

    return () => clearTimeout(productionRef.current);
  }, [enProduction, ble, ouvriers, meteo, vitesseProdMs, morale]);

  // --- Météo aléatoire toutes les 20s
  useEffect(() => {
    const iv = setInterval(() => {
      const r = Math.random();
      if (r < 0.6) setMeteo("Soleil");
      else if (r < 0.9) setMeteo("Pluie");
      else setMeteo("Sécheresse");
      setNotif("La météo a changé.");
    }, 20000);
    return () => clearInterval(iv);
  }, []);

  // --- Actions utilisateur
  function améliorerMoulin() {
    const cost = 60;
    if (argent < cost) {
      setNotif("Pas assez d'argent pour améliorer le moulin.");
      return;
    }
    if (vitesseProdMs <= 1500) {
      setNotif("Le moulin est déjà bien optimisé.");
      return;
    }
    setArgent((a) => a - cost);
    setVitesseProdMs((v) => Math.max(1500, v - 1200));
    setNotif("Amélioration réalisée : vitesse augmentée !");
  }

  function embaucher() {
    const cost = 25;
    if (argent < cost) {
      setNotif("Pas assez d'argent pour embaucher.");
      return;
    }
    setArgent((a) => a - cost);
    setOuvriers((o) => o + 1);
    setNotif("Un nouvel ouvrier rejoint ton moulin.");
  }

  function acheterBle(qty = 20) {
    const prix = Math.ceil(qty * 0.6); // prix par blé
    if (argent < prix) {
      setNotif("Pas assez d'argent pour acheter du blé.");
      return;
    }
    setArgent((a) => a - prix);
    setBle((b) => b + qty);
    setNotif(`Acheté ${qty} blé pour ${prix}🪙.`);
  }

  function lancerRechercheMoulinVent() {
    if (techMoulinVent) {
      setNotif("Moulin à vent déjà débloqué.");
      return;
    }
    if (rechercheEnCours) {
      setNotif("Recherche en cours...");
      return;
    }
    if (argent < 140) {
      setNotif("Pas assez d'argent pour la recherche.");
      return;
    }
    setArgent((a) => a - 140);
    setRechercheEnCours(true);
    setNotif("Recherche : moulin à vent lancée (15s).");
    setTimeout(() => {
      setTechMoulinVent(true);
      setRechercheEnCours(false);
      // bonus automatique : réduit le temps prod
      setVitesseProdMs((v) => Math.max(1000, v - 1200));
      setNotif("Technologie moulin à vent débloquée !");
    }, 15000);
  }

  // --- UI helpers
  function format(n) {
    return Math.floor(n);
  }

  // small cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(productionRef.current);
    };
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">🏰 <span>Medieval Mill Master</span></div>
        <div className="top-stats">
          <div>🪙 {format(argent)}</div>
          <div>🌾 {format(ble)}</div>
          <div>🥖 {format(pain)}</div>
        </div>
      </header>

      <main className="container">
        <section className="left">
          <div className="panel moulin">
            <h2>Moulin principal</h2>
            <div className="moulin-visual">
              <div className={`wheel ${enProduction ? "spin" : ""}`}></div>
              <div className="mill-body"></div>
            </div>

            <div className="stats-grid">
              <div><strong>Vitesse :</strong> {(vitesseProdMs / 1000).toFixed(1)} s / cycle</div>
              <div><strong>Ouvriers :</strong> {ouvriers}</div>
              <div><strong>Morale :</strong> {morale}%</div>
              <div><strong>Météo :</strong> <span className={`badge ${meteo.toLowerCase()}`}>{meteo}</span></div>
            </div>

            <div className="progress-row">
              <div className="progress-label">Production</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ animationDuration: `${vitesseProdMs}ms` , animationPlayState: enProduction ? 'running' : 'paused'}}></div>
              </div>
            </div>

            <div className="controls">
              <button onClick={acheterBle}>Acheter 20 blé</button>
              <button onClick={embaucher}>Embaucher ouvrier (-25🪙)</button>
              <button onClick={améliorerMoulin}>Améliorer moulin (-60🪙)</button>
            </div>
          </div>

          <div className="panel atelier">
            <h3>Atelier</h3>
            <p>Farine convertie automatiquement en pain (3 farine → 1 pain). Pain vendu automatiquement pour 8🪙.</p>
            <div className="mini-stats">
              <div><strong>Farine stockée :</strong> {format(farine)}</div>
              <div><strong>Pain stocké :</strong> {format(pain)}</div>
            </div>
            <div className="controls small">
              <button onClick={() => { setFarine((f) => f + 1); setNotif("Production manuelle : +1 farine"); }}>Produire +1 farine</button>
              <button onClick={() => { if (pain > 0) { setPain(0); setArgent((a)=>a + pain * 8); setNotif(`Vend tout le pain pour ${pain * 8}🪙`); } else setNotif("Pas de pain à vendre."); }}>Vendre tout le pain</button>
            </div>
          </div>
        </section>

        <aside className="right">
          <div className="panel tech">
            <h3>Arbre technologique</h3>
            <div className="tech-item">
              <div className={`tech-icon ${techMoulinVent ? "unlocked" : ""}`}>💨</div>
              <div className="tech-body">
                <strong>Moulin à vent</strong>
                <div className="tech-desc">Augmente la production et réduit la durée des cycles.</div>
              </div>
              <div className="tech-action">
                <button onClick={lancerRechercheMoulinVent} disabled={techMoulinVent || rechercheEnCours}>
                  {techMoulinVent ? "Débloqué" : rechercheEnCours ? "Recherche..." : "Lancer (140🪙)"}
                </button>
              </div>
            </div>
          </div>

          <div className="panel events">
            <h3>Événements</h3>
            <div className="event-item">
              <div className="badge small">{meteo}</div>
              <div className="event-body">
                <p>La météo influence la quantité de farine produite par cycle. (Soleil > Pluie > Sécheresse)</p>
              </div>
              <div className="event-action">
                <button onClick={() => { setMeteo("Soleil"); setNotif("Météo forcée : Soleil"); }}>Forcer Soleil</button>
              </div>
            </div>

            <div className="event-item">
              <div className="badge small">Temps</div>
              <div className="event-body">
                <p>Cycle de production : {(vitesseProdMs / 1000).toFixed(1)}s — modifiable via améliorations.</p>
              </div>
              <div className="event-action">
                <button onClick={() => { saveGame(); }}>Sauvegarder</button>
              </div>
            </div>

            <div className="event-item">
              <div className="badge small">Gestion</div>
              <div className="event-body">
                <p>Morale, salaires et évènements peuvent affecter la production.</p>
              </div>
              <div className="event-action">
                <button onClick={() => { resetGame(); }}>Réinitialiser</button>
              </div>
            </div>
          </div>

          <div className="panel info">
            <h3>Notifications</h3>
            <div className="notif">{notif}</div>
            <div className="small-controls">
              <label><input type="checkbox" checked={autosaveOn} onChange={() => setAutosaveOn(!autosaveOn)} /> Autosave</label>
              <div className="note">Sauvegarde toutes les 5s si activé.</div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="footer">
        Prototype — concept jouable. Développé pour test local.
      </footer>

      <style jsx>{`
        :root{
          --primary:#3367d6;
          --primary-2:#4285f4;
          --bg:#f6f8fb;
          --card:#ffffff;
          --muted:#6b7280;
        }
        .page{min-height:100vh; background:linear-gradient(180deg,#fbfdff,#f3f7ff); display:flex; flex-direction:column;}
        .topbar{display:flex; justify-content:space-between; align-items:center; padding:18px 24px; background:rgba(255,255,255,0.6); border-bottom:1px solid rgba(0,0,0,0.04); backdrop-filter: blur(4px);}
        .brand{font-weight:700; color:var(--primary); font-size:1.1rem; display:flex; gap:8px; align-items:center;}
        .top-stats{display:flex; gap:14px; color:var(--muted); font-weight:600;}

        .container{display:flex; gap:18px; padding:28px; width:100%; max-width:1200px; margin:0 auto; flex:1;}
        .left{flex:2; display:flex; flex-direction:column; gap:18px;}
        .right{flex:1; display:flex; flex-direction:column; gap:18px;}

        .panel{background:var(--card); border-radius:12px; padding:18px; box-shadow:0 6px 20px rgba(18,38,79,0.06); border:1px solid rgba(20,40,80,0.03);}

        .moulin-visual{display:flex; align-items:center; gap:18px; justify-content:center; padding:10px 0;}
        .wheel{width:110px; height:110px; border-radius:50%; border:12px solid var(--primary); border-top-color:transparent; box-sizing:border-box; transform-origin:center; }
        .wheel.spin{ animation:spin linear infinite; animation-duration:4s; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .mill-body{width:100px; height:80px; background:var(--primary); border-radius:6px; box-shadow:inset 0 0 24px rgba(0,0,0,0.12); transform:translateY(-12px);}

        .stats-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:8px; color:var(--muted); margin-top:6px;}
        .badge{padding:6px 10px; border-radius:8px; font-weight:700; color:#fff;}
        .soleil{background:#f4b400; box-shadow:0 6px 14px rgba(244,180,0,0.16)}
        .pluie{background:var(--primary-2); box-shadow:0 6px 14px rgba(66,133,244,0.12)}
        .sécheresse{background:#db4437; box-shadow:0 6px 14px rgba(219,68,55,0.12)}

        .progress-row{margin-top:14px;}
        .progress-bar{width:100%; height:10px; background:linear-gradient(90deg,#eef3ff,#f8f9ff); border-radius:8px; overflow:hidden; border:1px solid rgba(20,40,80,0.03);}
        .progress-fill{height:100%; width:100%; background:linear-gradient(90deg,var(--primary),var(--primary-2)); transform:translateX(-100%); animation-name:fillAnim; animation-timing-function:linear; animation-iteration-count:infinite; }
        .progress-fill.paused{animation-play-state:paused;}
        @keyframes fillAnim{ from{transform:translateX(-100%);} to{transform:translateX(0%);} }

        .controls{display:flex; gap:10px; justify-content:center; margin-top:12px; flex-wrap:wrap;}
        .controls.small{justify-content:flex-start;}
        button{background:var(--primary); color:white; padding:10px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:700; box-shadow:0 6px 18px rgba(51,103,214,0.12);}
        button:active{transform:translateY(1px);}
        button[disabled]{opacity:0.5; cursor:not-allowed;}

        .atelier .mini-stats{display:flex; gap:12px; color:var(--muted); margin-top:8px;}
        .tech-item{display:flex; gap:12px; align-items:center;}
        .tech-icon{width:46px;height:46px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:#f2f6ff;}
        .tech-icon.unlocked{background:linear-gradient(90deg,var(--primary),var(--primary-2)); color:white;}
        .tech-body{flex:1;}
        .tech-action button{padding:8px 10px; font-size:0.95rem; border-radius:8px;}

        .events .event-item{display:flex; gap:10px; align-items:center; margin-bottom:10px;}
        .events .badge.small{padding:6px 8px; border-radius:6px; background:#f2f4f9; color:var(--muted); font-weight:700;}

        .panel.info .notif{min-height:54px; display:flex; align-items:center; color:var(--muted); font-style:italic; margin-bottom:8px;}
        .small-controls{display:flex; gap:8px; align-items:center; font-size:0.9rem; color:var(--muted);}

        .footer{padding:12px; text-align:center; color:var(--muted); font-size:0.9rem; background:transparent; border-top:1px solid rgba(0,0,0,0.025);}

        /* Responsive */
        @media (max-width: 980px) {
          .container{flex-direction:column; padding:18px;}
          .left, .right{width:100%;}
        }
      `}</style>
    </div>
  );
}
