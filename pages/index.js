import { useEffect, useState, useRef } from "react";

export default function Home() {
  // Ressources et stats
  const [blé, setBlé] = useState(100);
  const [farine, setFarine] = useState(0);
  const [argent, setArgent] = useState(50);

  // Production
  const [vitesseProduction, setVitesseProduction] = useState(5000); // ms pour produire 1 farine
  const [enProduction, setEnProduction] = useState(false);

  // Personnel
  const [ouvriers, setOuvriers] = useState(1);
  const salaireOuvrier = 2; // coût argent / cycle

  // Tech
  const [techMoulinVent, setTechMoulinVent] = useState(false);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  // Événements météo
  const [meteo, setMeteo] = useState("Soleil"); // Soleil, Pluie, Sécheresse
  const meteoImpact = { Soleil: 1, Pluie: 0.8, Sécheresse: 0.5 };

  // Notifications
  const [notif, setNotif] = useState("");

  // Ref pour timer production
  const timerRef = useRef(null);

  // Production cycle
  useEffect(() => {
    if (enProduction) return; // empêcher double production
    if (blé < ouvriers) {
      setNotif("Pas assez de blé pour tous les ouvriers !");
      return;
    }
    if (ouvriers <= 0) {
      setNotif("Vous n'avez pas d'ouvriers !");
      return;
    }
    setEnProduction(true);
    timerRef.current = setTimeout(() => {
      // Consomme blé selon nombre ouvriers et météo
      const bléConsommé = ouvriers;
      if (blé < bléConsommé) {
        setNotif("Pas assez de blé pour produire !");
        setEnProduction(false);
        return;
      }
      setBlé((b) => b - bléConsommé);
      // Produit farine selon ouvriers et météo
      const farineProduite = Math.floor(ouvriers * meteoImpact[meteo]);
      setFarine((f) => f + farineProduite);
      // Vente automatique farine
      const vente = farineProduite * 3; // 3 argent par farine
      setFarine((f) => f - farineProduite);
      setArgent((a) => a + vente);
      // Salaire ouvriers
      const salaireTotal = ouvriers * salaireOuvrier;
      setArgent((a) => a - salaireTotal);
      setNotif(`Production terminée : ${farineProduite} farine vendue pour ${vente} pièces.`);
      setEnProduction(false);
    }, vitesseProduction);
    return () => clearTimeout(timerRef.current);
  }, [enProduction, blé, ouvriers, meteo, vitesseProduction]);

  // Gestion météo aléatoire toutes les 20s
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.6) setMeteo("Soleil");
      else if (rand < 0.85) setMeteo("Pluie");
      else setMeteo("Sécheresse");
      setNotif("Météo mise à jour !");
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Amélioration moulin (réduit temps production)
  function améliorerMoulin() {
    if (argent < 50) {
      setNotif("Pas assez d'argent pour améliorer !");
      return;
    }
    if (vitesseProduction <= 1000) {
      setNotif("Moulin déjà optimisé !");
      return;
    }
    setArgent((a) => a - 50);
    setVitesseProduction((v) => Math.max(1000, v - 1000));
    setNotif("Moulin amélioré ! Production plus rapide.");
  }

  // Embaucher ouvrier
  function embaucherOuvrier() {
    if (argent < 20) {
      setNotif("Pas assez d'argent pour embaucher !");
      return;
    }
    setArgent((a) => a - 20);
    setOuvriers((o) => o + 1);
    setNotif("Ouvrier embauché.");
  }

  // Recherche moulin à vent
  function lancerRecherche() {
    if (rechercheEnCours) {
      setNotif("Recherche déjà en cours.");
      return;
    }
    if (argent < 100) {
      setNotif("Pas assez d'argent pour lancer la recherche.");
      return;
    }
    setArgent((a) => a - 100);
    setRechercheEnCours(true);
    setNotif("Recherche moulin à vent lancée...");
    setTimeout(() => {
      setTechMoulinVent(true);
      setRechercheEnCours(false);
      setNotif("Technologie moulin à vent débloquée !");
    }, 15000);
  }

  return (
    <>
      <main>
        <h1>🏰 Medieval Mill Master</h1>

        <section className="stats">
          <div><strong>Blé :</strong> {blé}</div>
          <div><strong>Farine :</strong> {farine}</div>
          <div><strong>Argent :</strong> {argent} 🪙</div>
          <div><strong>Ouvriers :</strong> {ouvriers}</div>
          <div><strong>Météo :</strong> <span className={`meteo ${meteo.toLowerCase()}`}>{meteo}</span></div>
          <div><strong>Production :</strong> {enProduction ? "En cours..." : "Arrêtée"}</div>
          <div><strong>Vitesse prod. :</strong> {(vitesseProduction / 1000).toFixed(1)}s / cycle</div>
          <div><strong>Recherche moulin à vent :</strong> {techMoulinVent ? "Débloqué ✅" : rechercheEnCours ? "En cours..." : "Non débloqué"}</div>
        </section>

        <section className="actions">
          <button onClick={améliorerMoulin} disabled={enProduction}>Améliorer moulin (-50🪙)</button>
          <button onClick={embaucherOuvrier}>Embaucher ouvrier (-20🪙)</button>
          <button onClick={lancerRecherche} disabled={techMoulinVent || rechercheEnCours}>Lancer recherche moulin à vent (-100🪙)</button>
        </section>

        <section className="moulin-anim">
          <div className={`moulin ${enProduction ? "tournant" : ""}`}>
            <div className="roue"></div>
            <div className="corps"></div>
          </div>
        </section>

        <section className="notification">{notif}</section>
      </main>

      <style jsx>{`
        main {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem 2rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f9f9f9;
          border-radius: 10px;
          box-shadow: 0 0 15px #aaa;
          user-select: none;
          text-align: center;
        }
        h1 {
          margin-bottom: 1.5rem;
          color: #3367d6;
          font-weight: 700;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px 20px;
          margin-bottom: 2rem;
          font-size: 1.1rem;
          color: #222;
        }
        .actions {
          margin-bottom: 2rem;
        }
        button {
          background-color: #3367d6;
          border: none;
          color: white;
          padding: 10px 20px;
          margin: 0 10px 10px 10px;
          font-size: 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        button:hover:not(:disabled) {
          background-color: #4285f4;
        }
        button:disabled {
          background-color: #aaa;
          cursor: not-allowed;
        }
        .moulin-anim {
          margin: 2rem auto;
          width: 200px;
          height: 200px;
          position: relative;
          perspective: 600px;
        }
        .moulin {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto;
        }
        .roue {
          width: 120px;
          height: 120px;
          border: 12px solid #3367d6;
          border-radius: 50%;
          border-top-color: transparent;
          margin: 0 auto;
          box-sizing: border-box;
          transform-origin: center center;
          animation-play-state: paused;
        }
        .tournant .roue {
          animation: rotation 4s linear infinite;
          animation-play-state: running;
        }
        .corps {
          width: 90px;
          height: 120px;
          background: #3367d6;
          margin: -135px auto 0;
          border-radius: 0 0 15px 15px;
          box-shadow: inset 0 0 12px #254e9b;
        }
        .notification {
          min-height: 40px;
          margin-top: 1rem;
          font-style: italic;
          color: #555;
          user-select: text;
          transition: opacity 0.3s ease;
        }
        .meteo {
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 5px;
          color: white;
          user-select: none;
        }
        .soleil {
          background: #f4b400;
          box-shadow: 0 0 8px #f4b400;
        }
        .pluie {
          background: #4285f4;
          box-shadow: 0 0 8px #4285f4;
        }
        .sécheresse {
          background: #db4437;
          box-shadow: 0 0 8px #db4437;
        }
        @keyframes rotation {
          0% {transform: rotate(0deg);}
          100% {transform: rotate(360deg);}
        }
        @media (max-width: 480px) {
          main {
            padding: 1rem;
          }
          .stats {
            grid-template-columns: 1fr;
          }
          button {
            margin: 0.5rem 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
