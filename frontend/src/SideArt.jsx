import octane from "./assets/Octane_Banner.png";
import pathfinder from "./assets/582-5827420_apex-legends-characters-pathfinder-hd-png-download.png";

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
