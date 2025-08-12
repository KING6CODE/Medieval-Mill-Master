// pages/technologie.js
import { useEffect, useState } from "react";
import Link from "next/link";

const TECH_KEY = "mm_tech_v2";
const SAVE_KEY = "mm_save_v2";

const TECH_NODES = [
  { id: "hand_tools", label: "Outils taillés", cost: 12, prereq: [], epoch:"Préhistoire", desc:"Outils basiques — +8% rendement", icon:"🪨" },
  { id: "fire", label: "Maîtrise du feu", cost: 18, prereq: ["hand_tools"], epoch:"Préhistoire", desc:"Cuisson & conservation", icon:"🔥" },
  { id: "wheel_stone", label: "Roue de pierre", cost: 30, prereq: ["hand_tools"], epoch:"Antiquité", desc:"Première mécanique", icon:"⚙️" },

  { id: "water_mill", label: "Moulin à eau", cost: 90, prereq: ["wheel_stone"], epoch:"Antiquité", desc:"Production +15%", icon:"💧" },
  { id: "wheel_iron", label: "Roue en fer", cost: 140, prereq: ["water_mill"], epoch:"Moyen Âge", desc:"Durabilité & rendement", icon:"🛠️" },
  { id: "guilds", label: "Guildes", cost: 200, prereq: ["wheel_iron"], epoch:"Moyen Âge", desc:"Organisation & baisse salaire", icon:"🏛️" },

  { id: "wind_mill", label: "Moulin à vent", cost: 360, prereq: ["water_mill"], epoch:"Renaissance", desc:"Cycles réduits et rendement", icon:"💨" },
  { id: "steam_engine", label: "Machine à vapeur", cost: 760, prereq: ["wind_mill"], epoch:"Révolution", desc:"Puissance industrielle", icon:"🔥⚙️" },
  { id: "factory_lines", label: "Chaînes de montage", cost: 980, prereq: ["steam_engine"], epoch:"Révolution", desc:"Production de masse", icon:"🏭" },

  { id: "electric_motors", label: "Moteurs électriques", cost: 1700, prereq: ["factory_lines"], epoch:"Moderne", desc:"Vitesse & efficience", icon:"🔌" },
  { id: "market_network", label: "Réseau commercial", cost: 1400, prereq: ["guilds"], epoch:"Moderne", desc:"Meilleure vente", icon:"🛒" },

  { id: "computing", label: "Informatique", cost: 3200, prereq: ["electric_motors"], epoch:"Moderne", desc:"Optimisation & contrôle", icon:"💻" },
  { id: "ai_automation", label: "IA industrielle", cost: 9200, prereq: ["computing"], epoch:"Moderne", desc:"Gestion autonome", icon:"🤖" },

  { id: "space_mining", label: "Exploitation astéroïdes", cost: 16000, prereq: ["ai_automation"], epoch:"Spatiale", desc:"Métaux rares", icon:"☄️" },
  { id: "fusion_drive", label: "Propulsion fusion", cost: 30000, prereq: ["space_mining"], epoch:"Spatiale", desc:"Voyages interplanétaires", icon:"🚀" },
  { id: "colonies", label: "Colonies planétaires", cost: 70000, prereq: ["fusion_drive"], epoch:"Spatiale", desc:"Production hors planète", icon:"🏙️" }
];

export default function Technologie() {
  const [unlocked, setUnlocked] = useState({});
  const [gold, setGold] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
    setUnlocked(t || {});
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    setGold(s?.money ?? 0);
  }, []);

  function canAfford(cost) {
    return gold >= cost;
  }

  function prerequisitesMet(node) {
    if (!node.prereq || node.prereq.length === 0) return true;
    return node.prereq.every(p => unlocked[p]);
  }

  function buyNode(node) {
    if (unlocked[node.id]) { setMsg("Déjà débloqué."); return; }
    if (!prerequisitesMet(node)) { setMsg("Pré-requis manquant."); return; }
    if (!canAfford(node.cost)) { setMsg("Pas assez d'or."); return; }

    // subtract gold from save
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      s.money = Math.max(0, (s.money || 0) - node.cost);
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      setGold(s.money);
    } catch (e) {
      console.error(e);
    }

    const next = { ...unlocked, [node.id]: true };
    localStorage.setItem(TECH_KEY, JSON.stringify(next));
    setUnlocked(next);
    setMsg(`${node.label} débloqué !`);

    // dispatch a custom event so / (index) reacts immediately in the same tab
    window.dispatchEvent(new Event("tech-updated"));
  }

  const epochs = [...new Set(TECH_NODES.map(n => n.epoch))];

  return (
    <div className="page-tech">
      <header className="head">
        <div>
          <h1>Arbre Technologique</h1>
          <div className="sub">Progresse de la Préhistoire à l'Ère Spatiale</div>
        </div>
        <div className="wallet">Or : <strong>{gold}🪙</strong></div>
      </header>

      <main className="main">
        <div className="timeline">
          {epochs.map(epoch => (
            <section key={epoch} className="epoch">
              <h3>{epoch}</h3>
              <div className="grid">
                {TECH_NODES.filter(n => n.epoch === epoch).map(node => {
                  const ok = prerequisitesMet(node);
                  return (
                    <article key={node.id} className={`node ${unlocked[node.id] ? "unlocked" : ""} ${ok ? "available" : "blocked"}`}>
                      <div className="icon">{node.icon}</div>
                      <div className="info">
                        <div className="title">{node.label}</div>
                        <div className="desc">{node.desc}</div>
                        <div className="meta">Coût: {node.cost} 🪙 • Préreq: {node.prereq.length ? node.prereq.join(", ") : "—"}</div>
                      </div>
                      <div className="actions">
                        <button onClick={() => buyNode(node)} disabled={!ok || unlocked[node.id]}>{unlocked[node.id] ? "Débloqué" : ok ? `Débloquer (${node.cost})` : "Verrouillé"}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="side">
          <div className="card">
            <h4>Info</h4>
            <p>Débloquer une technologie retire l'or de ta sauvegarde. Revenez au jeu pour voir les effets appliqués (ils s'appliquent déjà automatiquement ici via l'événement 'tech-updated').</p>
            <div className="msg">{msg}</div>
            <div style={{ marginTop: 12 }}>
              <Link href="/"><a className="link">Retour au jeu</a></Link>
            </div>
          </div>
        </aside>
      </main>

      <style jsx>{`
        .page-tech { min-height:100vh; padding:28px; background: linear-gradient(180deg,#07102a,#061427); color:#e9f4ff; }
        .head { max-width:1200px; margin:0 auto 18px; display:flex; justify-content:space-between; align-items:center; }
        .sub { color:rgba(255,255,255,0.7); margin-top:6px; }
        .wallet { font-weight:900; color:#dff3ff; }
        .main { max-width:1200px; margin:0 auto; display:flex; gap:18px; align-items:flex-start; }
        .timeline { flex:2; display:flex; flex-direction:column; gap:12px; }
        .epoch { padding:12px; border-radius:10px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.03); }
        .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(320px,1fr)); gap:10px; margin-top:10px; }
        .node { display:flex; gap:12px; align-items:flex-start; padding:10px; border-radius:8px; background: rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.02); }
        .node.unlocked { background: linear-gradient(90deg,#2f6be6,#4285f4); color:white; box-shadow:0 10px 30px rgba(50,80,200,0.12); }
        .icon { width:56px; height:56px; border-radius:8px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.02); font-size:22px; }
        .title { font-weight:900; }
        .desc { color: rgba(255,255,255,0.8); margin-top:6px; }
        .meta { margin-top:8px; color:#cfe3ff; font-size:0.9rem; }
        .actions button { background: linear-gradient(90deg,#3367d6,#4285f4); border:none; color:white; padding:8px 10px; border-radius:8px; cursor:pointer; }
        .side { width:320px; }
        .card { padding:12px; border-radius:8px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.03); }
        .link { display:inline-block; margin-top:8px; padding:8px 10px; color:#cfe3ff; border:1px solid rgba(255,255,255,0.04); border-radius:8px; text-decoration:none; }
        .msg { margin-top:8px; color:#eaf6ff; font-weight:700; }
        @media (max-width:980px) { .main { flex-direction:column; } .side { width:100%; } }
      `}</style>
    </div>
  );
}

