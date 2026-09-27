import octane from "./assets/octane.png";
import pathfinder from "./assets/pathfinder.png";

export function LeftFigure() {
  return (
    <img
      src={octane}
      alt=""
      className="side-figure side-figure-left"
      aria-hidden="true"
    />
  );
}

export function RightFigure() {
  return (
    <img
      src={pathfinder}
      alt=""
      className="side-figure side-figure-right"
      aria-hidden="true"
    />
  );
}
