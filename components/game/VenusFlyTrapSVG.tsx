'use client';

import { useEffect, useRef, useState } from 'react';

export interface VenusFlyTrapSVGProps {
  /** 0 = closed, 1 = fully open */
  trapOpen: number;
  /** Water level 0–100 for visual fill inside the trap */
  waterLevel: number;
  /** Number of caught bugs shown inside the trap */
  caughtBugs: number;
  /** Nutrient level 0–100 for growth glow effect */
  nutrientLevel: number;
  /** Whether the plant appears wilted / droopy */
  isWilting: boolean;
  /** Increment to trigger a quick snap-shut animation */
  snapTrigger: number;
  className?: string;
}

export default function VenusFlyTrapSVG({
  trapOpen,
  waterLevel,
  caughtBugs,
  nutrientLevel,
  isWilting,
  snapTrigger,
  className = '',
}: VenusFlyTrapSVGProps) {
  const [snapping, setSnapping] = useState(false);
  const prevTriggerRef = useRef(0);

  useEffect(() => {
    if (snapTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = snapTrigger;
      if (snapTrigger > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: brief animation trigger on prop change
        setSnapping(true);
        const t = setTimeout(() => setSnapping(false), 200);
        return () => clearTimeout(t);
      }
    }
  }, [snapTrigger]);

  const effectiveOpen = snapping ? 0 : trapOpen;
  const lobeAngle = effectiveOpen * 30;
  const wiltAngle = isWilting ? 10 : 0;
  const plantScale = 1 + (nutrientLevel / 100) * 0.12;

  const lobeTransition = snapping
    ? 'transform 0.1s ease-in'
    : 'transform 0.3s ease-out';

  /** Generate cilia (teeth) along the opening edge of a lobe. */
  const renderCilia = (count: number, tipDir: 1 | -1) =>
    Array.from({ length: count }).map((_, i) => {
      const t = (i + 0.5) / count;
      const x = -22 + t * 57;
      const curve = Math.sin(t * Math.PI);
      const baseY = tipDir * curve * -2;
      const tipY = baseY + (6 + curve * 4) * tipDir;
      return (
        <path
          key={i}
          d={`M ${x - 1.5},${baseY} L ${x},${tipY} L ${x + 1.5},${baseY}`}
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="0.5"
        />
      );
    });

  const bugPositions: [number, number][] = [
    [-5, 5],
    [8, -5],
    [-10, -10],
    [12, 8],
    [0, 15],
  ];

  return (
    <svg viewBox="0 0 240 320" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vft-pot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4845a" />
          <stop offset="100%" stopColor="#a0522d" />
        </linearGradient>
        <linearGradient id="vft-stem" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
        <radialGradient id="vft-inner">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="60%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
        {/* Soft drop shadow for everything anchored above the soil */}
        <filter id="vft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
        </filter>
        {/* Idle breathing + blink keyframes, scoped to this SVG via a unique prefix */}
        <style>{`
          @keyframes vft-breathe {
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.025); }
          }
          @keyframes vft-blink {
            0%, 92%, 100% { transform: scaleY(1); }
            96%           { transform: scaleY(0.08); }
          }
          .vft-breathe {
            transform-origin: 120px 245px;
            animation: vft-breathe 3.6s ease-in-out infinite;
            will-change: transform;
          }
          .vft-eye {
            transform-box: fill-box;
            transform-origin: center;
            animation: vft-blink 7s ease-in-out infinite;
          }
          .vft-eye-right { animation-delay: -3.4s; }
        `}</style>

      </defs>

      {/* ===== Pot ===== */}
      <path
        d="M 70,248 L 58,298 L 182,298 L 170,248 Z"
        fill="url(#vft-pot)"
        stroke="#8b4513"
        strokeWidth="2.5"
        filter="url(#vft-shadow)"
      />
      <rect
        x="64"
        y="240"
        width="112"
        height="12"
        rx="3"
        fill="#d4845a"
        stroke="#8b4513"
        strokeWidth="2"
      />
      {/* Pot decorative grooves */}
      <line x1="100" y1="260" x2="100" y2="295" stroke="#b56b3a" strokeWidth="1" opacity="0.3" />
      <line x1="140" y1="260" x2="140" y2="295" stroke="#b56b3a" strokeWidth="1" opacity="0.3" />
      <line x1="120" y1="258" x2="120" y2="296" stroke="#b56b3a" strokeWidth="0.6" opacity="0.2" />

      {/* ===== Soil ===== */}
      <ellipse cx="120" cy="246" rx="50" ry="6" fill="#3d2b1f" />
      <ellipse cx="120" cy="244" rx="45" ry="4" fill="#4a3728" />
      {/* Soil texture */}
      <circle cx="100" cy="245" r="1.5" fill="#5c4033" opacity="0.5" />
      <circle cx="130" cy="244" r="1" fill="#5c4033" opacity="0.4" />
      <circle cx="115" cy="246" r="1.5" fill="#5c4033" opacity="0.3" />
      <circle cx="140" cy="245" r="1" fill="#5c4033" opacity="0.3" />

      {/* ===== Water droplets on soil ===== */}
      {waterLevel > 5 && (() => {
        const dropCount = Math.min(Math.floor(waterLevel / 12) + 1, 8);
        const dropPositions: [number, number, number][] = [
          [95, 243, 2.2],
          [108, 244, 1.8],
          [132, 243, 2.0],
          [145, 244, 1.6],
          [82, 245, 1.5],
          [118, 242, 2.4],
          [155, 245, 1.7],
          [102, 245, 1.4],
        ];
        return (
          <g opacity={0.5 + (waterLevel / 100) * 0.5}>
            {dropPositions.slice(0, dropCount).map(([dx, dy, r], i) => (
              <g key={`drop-${i}`}>
                {/* Drop body */}
                <ellipse cx={dx} cy={dy} rx={r * 0.8} ry={r} fill="#38bdf8" />
                {/* Highlight */}
                <ellipse cx={dx - r * 0.2} cy={dy - r * 0.3} rx={r * 0.3} ry={r * 0.4} fill="#bae6fd" opacity="0.6" />
              </g>
            ))}
            {/* Damp soil darkening around drops */}
            <ellipse cx="120" cy="244" rx={20 + (waterLevel / 100) * 25} ry="3" fill="#1e3a5f" opacity={0.1 + (waterLevel / 100) * 0.15} />
          </g>
        );
      })()}

      {/* ===== Plant group (wilt + growth + idle breathing) ===== */}
      <g className="vft-breathe">
        <g
          transform={`translate(120, 245) scale(${plantScale}) rotate(${wiltAngle}) translate(-120, -245)`}
        >
        {/* Stem */}
        <path
          d="M 120,243 C 118,220 116,190 120,135"
          stroke="url(#vft-stem)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        {/* Stem highlight */}
        <path
          d="M 118,240 C 116,218 115,192 118,140"
          stroke="#4ade80"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
          strokeLinecap="round"
        />

        {/* ===== Stem leaves ===== */}
        <path
          d="M 116,205 C 100,195 90,200 95,210 C 100,215 112,210 116,205"
          fill="#22c55e"
          stroke="#16a34a"
          strokeWidth="1"
        />
        <path
          d="M 114,203 C 105,198 98,202 102,207"
          stroke="#166534"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 124,180 C 140,170 150,175 145,185 C 140,190 128,185 124,180"
          fill="#16a34a"
          stroke="#15803d"
          strokeWidth="1"
        />
        <path
          d="M 118,160 C 102,150 92,155 97,165 C 102,170 114,165 118,160"
          fill="#22c55e"
          stroke="#16a34a"
          strokeWidth="1"
        />
        <path
          d="M 117,158 C 108,153 102,157 106,162"
          stroke="#166534"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />

        {/* ===== Trap ===== */}
        <g transform="translate(120, 135)">
          {/* ----- Upper lobe ----- */}
          <g
            style={{
              transformOrigin: '0 0',
              transform: `rotate(${-lobeAngle}deg)`,
              transition: lobeTransition,
            }}
          >
            {/* Exterior */}
            <path
              d="M -25,0 C -28,-15 -20,-42 5,-48 C 30,-42 42,-15 38,0 Z"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="2"
            />
            {/* Interior */}
            <path
              d="M -20,0 C -22,-12 -16,-36 5,-42 C 26,-36 36,-12 33,0 Z"
              fill="url(#vft-inner)"
            />
            {/* Veins */}
            <path d="M 0,0 C 0,-12 -2,-30 2,-40" stroke="#991b1b" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M 10,0 C 10,-10 8,-28 12,-38" stroke="#991b1b" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M -10,0 C -10,-8 -12,-26 -8,-36" stroke="#991b1b" strokeWidth="0.8" fill="none" opacity="0.3" />
            {/* Digestive spots */}
            <circle cx="0" cy="-20" r="2.5" fill="#7f1d1d" opacity="0.5" />
            <circle cx="10" cy="-25" r="2" fill="#7f1d1d" opacity="0.4" />
            <circle cx="-8" cy="-18" r="2" fill="#7f1d1d" opacity="0.4" />
            <circle cx="15" cy="-15" r="1.5" fill="#7f1d1d" opacity="0.3" />
            <circle cx="5" cy="-32" r="1.5" fill="#7f1d1d" opacity="0.3" />
            {/* Eyes (each grouped so they can blink independently) */}
            <g className="vft-eye vft-eye-left">
              <circle cx="-8" cy="-30" r="6" fill="white" stroke="#166534" strokeWidth="1" />
              <circle cx="-6" cy="-30" r="3" fill="#1e1b4b" />
              <circle cx="-5" cy="-31" r="1.2" fill="white" />
            </g>
            <g className="vft-eye vft-eye-right">
              <circle cx="12" cy="-30" r="6" fill="white" stroke="#166534" strokeWidth="1" />
              <circle cx="14" cy="-30" r="3" fill="#1e1b4b" />
              <circle cx="15" cy="-31" r="1.2" fill="white" />
            </g>
            {/* Eyebrows - give expression */}
            <line x1="-14" y1="-37" x2="-3" y2="-38" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <line x1="6" y1="-38" x2="17" y2="-37" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            {/* Cilia (teeth pointing down) */}
            {renderCilia(9, 1)}
          </g>

          {/* ----- Lower lobe ----- */}
          <g
            style={{
              transformOrigin: '0 0',
              transform: `rotate(${lobeAngle}deg)`,
              transition: lobeTransition,
            }}
          >
            {/* Exterior */}
            <path
              d="M -25,0 C -30,15 -18,42 5,48 C 28,42 40,15 38,0 Z"
              fill="#16a34a"
              stroke="#15803d"
              strokeWidth="2"
            />
            {/* Interior */}
            <path
              d="M -20,0 C -24,12 -14,36 5,42 C 24,36 34,12 33,0 Z"
              fill="url(#vft-inner)"
            />
            {/* Veins */}
            <path d="M 0,0 C 0,12 -2,30 2,40" stroke="#991b1b" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M 10,0 C 10,10 8,28 12,38" stroke="#991b1b" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M -10,0 C -10,8 -12,26 -8,36" stroke="#991b1b" strokeWidth="0.8" fill="none" opacity="0.3" />
            {/* Digestive spots */}
            <circle cx="0" cy="20" r="2.5" fill="#7f1d1d" opacity="0.5" />
            <circle cx="10" cy="25" r="2" fill="#7f1d1d" opacity="0.4" />
            <circle cx="-8" cy="18" r="2" fill="#7f1d1d" opacity="0.4" />
            <circle cx="15" cy="15" r="1.5" fill="#7f1d1d" opacity="0.3" />
            <circle cx="5" cy="32" r="1.5" fill="#7f1d1d" opacity="0.3" />
            {/* Cilia (teeth pointing up) */}
            {renderCilia(9, -1)}
          </g>

          {/* ----- Caught bugs inside trap ----- */}
          {Array.from({ length: Math.min(caughtBugs, 5) }).map((_, i) => {
            const [bx, by] = bugPositions[i] ?? [0, 0];
            return (
              <g key={`bug-${i}`} transform={`translate(${bx}, ${by}) scale(0.55)`}>
                <ellipse cx="0" cy="0" rx="5" ry="3" fill="#4b5563" />
                <ellipse cx="-3" cy="-3" rx="4" ry="2" fill="white" opacity="0.5" transform="rotate(-20)" />
                <ellipse cx="3" cy="-3" rx="4" ry="2" fill="white" opacity="0.5" transform="rotate(20)" />
              </g>
            );
          })}


        </g>
      </g>
      </g>

      {/* ===== Nutrient glow + sparkles ===== */}
      {nutrientLevel > 0 && (
        <>
          <circle
            cx="120"
            cy="135"
            r={30 + (nutrientLevel / 100) * 20}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity={0.1 + (nutrientLevel / 100) * 0.3}
          >
            <animate
              attributeName="opacity"
              values={`${0.1 + (nutrientLevel / 100) * 0.3};${0.05 + (nutrientLevel / 100) * 0.15};${0.1 + (nutrientLevel / 100) * 0.3}`}
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {Array.from({ length: Math.min(Math.floor(nutrientLevel / 15), 6) }).map((_, i) => {
            const a = (i * 60 * Math.PI) / 180;
            const r = 48 + i * 4;
            return (
              <circle
                key={`spark-${i}`}
                cx={120 + Math.cos(a) * r}
                cy={135 + Math.sin(a) * r * 0.6}
                r="2"
                fill="#fbbf24"
                opacity="0.6"
              >
                <animate
                  attributeName="opacity"
                  values="0.6;0.15;0.6"
                  dur={`${1.5 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </>
      )}
    </svg>
  );
}
