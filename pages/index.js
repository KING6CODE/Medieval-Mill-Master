// pages/index.js
import { useState, useEffect } from "react";

export default function Home() {
  const [blé, setBlé] = useState(10);
  const [farine, setFarine] = useState(0);
  const [or, setOr] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [meteo, setMeteo] = useState("Soleil");
  const [notif, setNotif] = useState("");
  const [tutoStep, setTutoStep] = useState(0);

  // Charger état du tuto
  useEffect(() => {
    const tutoDone = localStorage.getItem("tutoDone");
    if (tutoDone) setTutoStep(-1); // tuto déjà fait
  }, []);

  // Production toutes les 5 sec
  useEffect(() => {
    const interval = setInterval(() => {
      setCycle((c) => c + 1);
      produire();
    }, 5000);
    return () => clearInterval(interval);
  }, [meteo]);

  // Changement météo
  useEffect(() => {
    const meteoTypes = ["Soleil", "Pluie", "Sécheresse"];
    const interval = setInterval(() => {
      setMeteo(meteoTypes[Math.floor(Math.random() * meteoTypes.length)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  function produire() {
    let bonus = meteo === "Soleil" ? 2 : meteo === "Pluie" ? 1 : 0.5;
    if (blé > 0) {
      setBlé((b) => Math.max(0, b - 1));
      setFarine((f) => f + bonus);
      setNotif(`Production : +${bonus} farine (Météo : ${meteo})`);
    } else {
      setNotif("Plus de blé !");
    }
  }

  function vendre() {
    if (farine >= 1) {
      setFarine((f) => f - 1);
      setOr((o) => o + 2);
      setNotif("Vente : +2 or");
    } else {
      setNotif("Pas assez de farine !");
    }
  }

  function acheterBle() {
    if (or >= 1) {
      setOr((o) => o - 1);
      setBlé((b) => b + 5);
      setNotif("Achat : +5 blé");
    } else {
      setNotif("Pas assez d'or !");
    }
  }

  function nextTuto() {
    if (tutoStep >= 3) {
      localStorage.setItem("tutoDone", "true");
      setTutoStep(-1);
    } else {
      setTutoStep((s) => s + 1);
    }
  }

  const tutoTexts = [
    "Bienvenue, Maître Meunier ! Cliquez sur 'Moudre du blé' pour produire de la farine.",
    "Vendez la farine pour obtenir de l'or.",
    "Utilisez votre or pour acheter plus de blé.",
    "La météo influence votre production."
  ];

  return (
    <div className="container">
      <h1>🏰 Medieval Mill Master</h1>
      <div className="stats">
        <p>🌾 Blé : {blé}</p>
        <p>🍞 Farine : {farine.toFixed(1)}</p>
        <p>💰 Or : {or}</p>
        <p>⏳ Cycles : {cycle}</p>
        <p>☀️ Météo : {meteo}</p>
      </div>

      <div className="actions">
        <button onClick={produire}>Moudre du blé</button>
        <button onClick={vendre}>Vendre 1 farine</button>
        <button onClick={acheterBle}>Acheter 5 blé</button>
      </div>

      {notif && <div className="notif">{notif}</div>}

      {/* Tutoriel */}
      {tutoStep >= 0 && (
        <div className="tuto">
          <p>{tutoTexts[tutoStep]}</p>
          <button onClick={nextTuto}>
            {tutoStep >= 3 ? "Terminer" : "Suivant"}
          </button>
        </div>
      )}

      <style jsx>{`
        .container {
          background: linear-gradient(135deg, #1e1e2f, #0d1b2a);
          color: #f0f0f0;
          min-height: 100vh;
          padding: 20px;
          font-family: sans-serif;
        }
        h1 {
          text-align: center;
          text-shadow: 1px 1px 4px black;
        }
        .stats p {
          margin: 5px 0;
        }
        .actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }
        button {
          background: #3367d6;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          transition: 0.3s;
        }
        button:hover {
          background: #4285f4;
          box-shadow: 0 0 10px #4285f4;
        }
        .notif {
          margin-top: 20px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          text-align: center;
        }
        .tuto {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          padding: 15px;
          border-radius: 8px;
          max-width: 300px;
          text-align: center;
          box-shadow: 0 0 10px black;
        }
        .tuto button {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}

