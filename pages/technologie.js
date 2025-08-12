// pages/technologie.js
import { useEffect, useState } from "react";
import Link from "next/link";

const TECH_KEY = "mm_tech_v1";
const SAVE_KEY = "mm_save_v1";

/*
  techNodes: id, label, cost (gold), prereqs[], epoch, desc, icon (emoji)
  You can easily extend nodes, add more effects in the game page by checking unlocked ids.
*/
const TECH_NODES = [
  // Préhistoire
  { id: "hand_tools", label: "Outils taillés", cost: 10, prereq: [], epoch:"Préhistoire", desc:"Outils basiques -> +10% production (tiny)", icon:"🪨" },
  { id: "fire", label: "Maîtrise du feu", cost: 16, prereq: ["hand_tools"], epoch:"Préhistoire", desc:"Permet cuisson et conservation", icon:"🔥" },
  { id: "wheel_stone", label: "Roue de pierre", cost: 28, prereq: ["hand_tools"], epoch:"Antiquité", desc:"Roue primitive pour meule", icon:"⚙️" },

  // Antiquité -> Moyen Âge
  { id: "water_mill", label: "Moulin à eau", cost: 80, prereq: ["wheel_stone"], epoch:"Antiquité", desc:"Production multipliée", icon:"💧" },
  { id: "wheel_iron", label: "Roue en fer", cost: 120, prereq: ["water_mill"], epoch:"Moyen Âge", desc:"Durabilité & rendement", icon:"🛠️" },
  { id: "guilds", label: "Guildes", cost: 180, prereq: ["wheel_iron"], epoch:"Moyen Âge", desc:"Réduction salaire, organisation", icon:"🏛️" },

  // Renaissance / Industrial
  { id: "wind_mill", label: "Moulin à vent", cost: 320, prereq: ["water_mill"], epoch:"Renaissance", desc:"Réduit de façon significative cycles", icon:"💨" },
  { id: "steam_engine", label: "Machine à vapeur", cost: 700, prereq: ["wind_mill"], epoch:"Révolution", desc:"Automatisation & scale", icon:"🔥⚙️" },
  { id: "factory_lines", label: "Chaînes de montage", cost: 900, prereq: ["steam_engine"], epoch:"Révolution", desc:"Production de masse", icon:"🏭" },

  // Moderne
  { id: "electric_motors", label: "Moteurs électriques", cost: 1700, prereq: ["factory_lines"], epoch:"Moderne", desc:"Vitesse & efficience", icon:"🔌" },
  { id: "market_network", label: "Réseau commercial", cost: 1400, prereq: ["guilds"], epoch:"Moderne", desc:"Meilleure vente, prix boost", icon:"🛒" },

  // Info / AI
  { id: "computing", label: "Informatique", cost: 3200, prereq: ["electric_motors"], epoch:"Moderne", desc:"Controle & optimisation", icon:"💻" },
  { id: "ai_automation", label: "IA industrielle", cost: 9000, prereq: ["computing"], epoch:"Moderne", desc:"Gestion autonome, gains majeurs", icon:"🤖" },

  // Spatial
  { id: "space_mining", label: "Exploitation astéroïdes", cost: 16000, prereq: ["ai_automation"], epoch:"Spatiale", desc:"Métaux rares", icon:"☄️" },
  { id: "fusion_drive", label: "Propulsion fusion", cost: 30000, prereq: ["space_mining"], epoch:"Spatiale", desc:"Voyages interplanétaires", icon:"🚀" },
  { id: "colonies", label: "Colonies planétaires", cost: 70000, prereq: ["fusion_drive"], epoch:"Spatiale", desc:"Production libre d'une autre planète", icon:"🏙️" }
];

export default function Technologie() {
  const [unlocked, setUnlocked] = useState({});
  const [gold, setGold] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem(TECH_KEY) || "{}");
    setUnlocked(t);
    // read gold from save
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    setGold(s?.money ?? 0);
  }, []);

  function canAfford(cost) {
    return gold >= cost;
  }

  function prerequisitesMet(node) {
    if (!node.prereq || node.prereq.length===0) return true;
    return node.prereq.every(p => unlocked[p]);
  }

  function buyNode(node) {
    if (unlocked[node.id]) { setMsg("Déjà débloqué."); return; }
    if (!prerequisitesMet(node)) { setMsg("Prérequis non remplis."); return; }
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
    const next = {...unlocked, [node.id]: true};
    localStorage.setItem(TECH_KEY, JSON.stringify(next));
    setUnlocked(next);
    setMsg(`${node.label} débloqué !`);
  }

  const epochs = [...new Set(TECH_NODES.map(n => n.epoch))];

  return (
    <div className="page-tech">
      <header className="head">
        <h1>Arbre Technologique</h1>
        <div className="sub">Progresse de la Préhistoire à l'Ère Spatiale — débloque technologies pour ton moulin.</div>
        <div className="bal">Or disponible: <strong>{gold}🪙</strong></div>
      </header>

      <main className="tech-main">
        <div className="timeline">
          {epochs.map(epoch => (
            <div className="epoch" key={epoch}>
              <h3>{epoch}</h3>
              <div className="nodes">
                {TECH_NODES.filter(n=>n.epoch===epoch).map(node=>(
                  <div key={node.id} className={`node ${unlocked[node.id] ? "unlocked" : ""} ${prerequisitesMet(node) ? "available": "locked"}`}>
                    <div className="icon">{node.icon}</div>
                    <div className="body">
                      <div className="title">{node.label}</div>
                      <div className="desc">{node.desc}</div>
                      <div className="meta">Coût: {node.cost} • {node.prereq.length ? `préreq: ${node.prereq.join(", ")}` : "aucun préreq."}</div>
                      <div className="actions">
                        <button onClick={()=>buyNode(node)} disabled={!prerequisitesMet(node) || unlocked[node.id]}>Débloquer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="right">
          <div className="card">
            <h3>Info</h3>
            <p>Débloquer une technologie retire immédiatement l'or nécessaire de ta sauvegarde. Revenez au jeu pour voir les effets appliqués.</p>
            <p>{msg}</p>
            <div style={{marginTop:12}}>
              <Link href="/"><a className="link-btn">Retour au jeu</a></Link>
            </div>
          </div>
        </aside>
      </main>

      <style jsx>{`
        .page-tech { min-height:100vh; background: linear-gradient(180deg,#07102a,#061427); color:#eaf3ff; padding:28px; }
        .head { max-width:1200px; margin:0 auto 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .head h1 { margin:0; font-size:1.4rem; }
        .head .bal { color:#cfe3ff; font-weight:800; }
        .tech-main { max-width:1200px; margin:0 auto; display:flex; gap:18px; align-items:flex-start; }
        .timeline { flex:2; display:flex; flex-direction:column; gap:14px; }
        .epoch { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:10px; padding:12px; border:1px solid rgba(255,255,255,0.03); }
        .epoch h3 { margin:0 0 8px 0; color:#fff; }
        .nodes { display:grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap:12px; }
        .node { display:flex; gap:10px; padding:10px; border-radius:8px; background: rgba(255,255,255,0.01); align-items:flex-start; border:1px solid rgba(255,255,255,0.02); }
        .node.unlocked { background: linear-gradient(90deg,#2f6be6,#4285f4); color:white; box-shadow:0 10px 30px rgba(50,80,200,0.12); }
        .node.locked { opacity:0.6; filter:grayscale(0.2); }
        .icon { width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:22px; background: rgba(255,255,255,0.02); }
        .body .title { font-weight:800; }
        .desc { margin-top:6px; color: rgba(255,255,255,0.8); font-size:0.95rem; }
        .meta { margin-top:6px; color:#cfe3ff; font-size:0.85rem; }
        .actions { margin-top:8px; }
        button { background: linear-gradient(90deg,#3367d6,#4285f4); border:none; padding:8px 10px; border-radius:8px; color:white; font-weight:800; cursor:pointer; }
        .right { width:320px; }
        .card { padding:12px; border-radius:10px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.03); }
        .link-btn { display:inline-block; margin-top:8px; padding:8px 10px; background:transparent; color:#cfe3ff; border:1px solid rgba(255,255,255,0.04); border-radius:8px; text-decoration:none; }
        @media (max-width:980px) {
          .tech-main { flex-direction:column; }
          .right { width:100%; }
        }
      `}</style>
    </div>
  );
}
