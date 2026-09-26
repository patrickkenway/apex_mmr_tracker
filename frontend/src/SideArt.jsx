export function LeftFigure() {
  return (
    <svg
      viewBox="0 0 200 700"
      className="side-figure side-figure-left"
      aria-hidden="true"
    >
      <path
        d="M60 700 L40 500 L70 380 L55 260 L90 160 L85 60 L120 0 L200 0 L200 700 Z"
        fill="var(--ember-dim)"
        opacity="0.35"
      />
      <path
        d="M90 160 L85 60 L120 0"
        stroke="var(--ember)"
        strokeWidth="3"
        fill="none"
        opacity="0.7"
      />
      <line
        x1="55"
        y1="260"
        x2="90"
        y2="160"
        stroke="var(--ember)"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}

export function RightFigure() {
  return (
    <svg
      viewBox="0 0 200 700"
      className="side-figure side-figure-right"
      aria-hidden="true"
    >
      <path
        d="M140 700 L160 480 L130 370 L145 230 L110 140 L118 40 L95 0 L0 0 L0 700 Z"
        fill="#153A45"
        opacity="0.4"
      />
      <circle
        cx="118"
        cy="75"
        r="22"
        fill="none"
        stroke="var(--signal)"
        strokeWidth="2"
        opacity="0.6"
      />
      <line
        x1="118"
        y1="75"
        x2="140"
        y2="75"
        stroke="var(--signal)"
        strokeWidth="2"
        opacity="0.8"
      />
    </svg>
  );
}
