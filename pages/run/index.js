import { useEffect } from "react";

export default function RunGame() {
  useEffect(() => {
    import("./game.js");
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/run/style.css" />
      <div id="ui">
        <div id="title">Run & Collapse</div>
        <div id="status">
          <span id="energy">Énergie: 100</span>
          <span id="weather">Météo: Clair</span>
          <span id="distance">Distance: 0 m</span>
        </div>
        <div id="controls">
          Touches: ←→ sauter(Z)/Space dash / C clone / R rewind
        </div>
      </div>
      <canvas id="game"></canvas>
    </>
  );
}
