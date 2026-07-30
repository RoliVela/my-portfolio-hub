'use client';

export interface PopBurstProps {
  id: string | number;
  /** X coordinate in pixels (relative to nearest positioned parent). */
  x: number;
  /** Y coordinate in pixels (relative to nearest positioned parent). */
  y: number;
  /** Tailwind class for the particle color. */
  particleColorClass?: string;
  /** Tailwind class for the expanding ring. */
  ringColorClass?: string;
  /** Number of flying particles. */
  particleCount?: number;
}

export function PopBurst({
  x,
  y,
  particleColorClass = 'bg-lime-300',
  ringColorClass = 'border-lime-300 bg-lime-300/40',
  particleCount = 6,
}: PopBurstProps) {
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = (i * Math.PI * 2) / particleCount;
    const dist = 14;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
    };
  });

  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }}>
      {/* Expanding ring */}
      <div
        className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${ringColorClass} animate-[ping_0.5s_ease-out_forwards]`}
      />
      {/* Flying particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute h-1.5 w-1.5 rounded-full ${particleColorClass}`}
          style={{
            animation: `pop-fly 0.5s ease-out forwards`,
            transform: `translate(-50%, -50%)`,
            ['--pop-x' as string]: `${p.x}px`,
            ['--pop-y' as string]: `${p.y}px`,
          }}
        />
      ))}
    </div>
  );
}

export interface FallingDustProps {
  id: string | number;
  /** Horizontal position as a percentage of the container. */
  x: number;
  /** Starting vertical position as a percentage of the container. */
  y: number;
  /** Particle color (hex or CSS color string). */
  color: string;
}

export function FallingDust({ x, y, color }: FallingDustProps) {
  return (
    <div
      className="absolute h-2 w-2 rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: color,
        animation: 'dust-fall 0.8s ease-in forwards',
      }}
    />
  );
}

export interface FallingDustOverlayProps {
  children: React.ReactNode;
}

export function FallingDustOverlay({ children }: FallingDustOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      {children}
    </div>
  );
}

export function GameParticleStyles() {
  return (
    <style jsx global>{`
      @keyframes pop-fly {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(
              calc(-50% + var(--pop-x)),
              calc(-50% + var(--pop-y))
            )
            scale(0);
          opacity: 0;
        }
      }
      @keyframes dust-fall {
        0% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(120px) scale(0.5);
          opacity: 0;
        }
      }
    `}</style>
  );
}
