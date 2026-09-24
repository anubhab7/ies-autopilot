import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { LEVEL_INFO } from '@/domain/autonomyEngine';
import { LEVELS, type Level } from '@/domain/types';
import { cn } from '@/lib/cn';

const DETENT_ANGLES = [-135, -45, 45, 135];
const LEVEL_COLORS: Record<Level, string> = {
  L0: 'var(--lane-manual)',
  L1: 'var(--lane-assist)',
  L2: 'var(--lane-auto)',
  L3: 'var(--lane-auto)',
};

function polar(c: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(rad), y: c - r * Math.cos(rad) };
}

function arcPath(c: number, r: number, from: number, to: number) {
  const start = polar(c, r, from);
  const end = polar(c, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/** Nearest detent index for a pointer angle (0 = top, clockwise positive). */
export function nearestDetent(angleDeg: number): number {
  const clamped = Math.max(-135, Math.min(135, angleDeg));
  return Math.round((clamped + 135) / 90);
}

export function AutonomyDial({
  value,
  onChange,
  label,
  size = 240,
  compact = false,
  interactive = true,
}: {
  value: Level;
  onChange?: (level: Level) => void;
  label: string;
  size?: number;
  compact?: boolean;
  interactive?: boolean;
}) {
  const index = LEVELS.indexOf(value);
  const angle = DETENT_ANGLES[index];
  const c = 120;
  const pad = compact || !interactive ? 0 : 18;
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const setIndex = (i: number) => {
    const next = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))];
    if (next !== value) onChange?.(next);
  };

  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.08) return;
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    setIndex(nearestDetent(deg));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      PageUp: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      PageDown: index - 1,
      Home: 0,
      End: LEVELS.length - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      setIndex(map[e.key]);
    }
  };

  const color = LEVEL_COLORS[value];
  const ticks = [];
  for (let a = -135; a <= 135; a += 15) {
    const major = DETENT_ANGLES.includes(a);
    const outer = polar(c, 104, a);
    const inner = polar(c, major ? 90 : 96, a);
    ticks.push(
      <line
        key={a}
        x1={outer.x}
        y1={outer.y}
        x2={inner.x}
        y2={inner.y}
        stroke={major ? 'var(--text)' : 'var(--hairline)'}
        strokeWidth={major ? 2 : 1.5}
        strokeLinecap="round"
      />,
    );
  }

  return (
    <div className="relative select-none" style={{ width: size + pad * 2, height: size + pad * 2 }}>
      <div
        role={interactive ? 'slider' : 'img'}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? label : `${label}: ${value}, ${LEVEL_INFO[value].name}`}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? 3 : undefined}
        aria-valuenow={interactive ? index : undefined}
        aria-valuetext={interactive ? `${value}, ${LEVEL_INFO[value].name}` : undefined}
        aria-orientation={interactive ? 'horizontal' : undefined}
        onKeyDown={interactive ? onKeyDown : undefined}
        className={cn('absolute rounded-full', interactive && 'cursor-grab touch-none')}
        style={{ left: pad, top: pad, width: size, height: size }}
        data-testid="autonomy-dial"
        data-level={value}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 240 240"
          width={size}
          height={size}
          aria-hidden
          onPointerDown={
            interactive
              ? (e) => {
                  dragging.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  fromPointer(e);
                }
              : undefined
          }
          onPointerMove={interactive ? (e) => dragging.current && fromPointer(e) : undefined}
          onPointerUp={
            interactive
              ? (e) => {
                  dragging.current = false;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              : undefined
          }
        >
          <circle cx={c} cy={c} r={116} fill="var(--surface)" stroke="var(--hairline)" strokeWidth={1.5} />
          <circle cx={c} cy={c} r={82} fill="var(--bg)" stroke="var(--hairline)" strokeWidth={1} />
          <path d={arcPath(c, 110, -135, 135)} fill="none" stroke="var(--hairline)" strokeWidth={4} strokeLinecap="round" />
          {index > 0 ? (
            <path
              d={arcPath(c, 110, -135, angle)}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              style={{ transition: 'stroke 200ms' }}
            />
          ) : null}
          {ticks}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: `${c}px ${c}px`,
              transition: 'transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1)',
            }}
          >
            <path d={`M ${c - 3} ${c} L ${c} ${c - 78} L ${c + 3} ${c} Z`} fill={color} />
          </g>
          <circle cx={c} cy={c} r={9} fill="var(--raised)" stroke="var(--hairline)" strokeWidth={1.5} />
          {!compact ? (
            <>
              <text x={c} y={c + 38} textAnchor="middle" fill="var(--text)" fontSize={26} fontWeight={650}>
                {value}
              </text>
              <text x={c} y={c + 56} textAnchor="middle" fill="var(--muted)" fontSize={11}>
                {LEVEL_INFO[value].name.replace(' with guardrails', '')}
              </text>
            </>
          ) : null}
        </svg>
      </div>
      {!compact && interactive
          ? LEVELS.map((level, i) => {
              const p = polar(size / 2 + pad, size / 2 + pad * 0.55, DETENT_ANGLES[i]);
              return (
                <button
                  key={level}
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  onClick={() => setIndex(i)}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 rounded-chip px-1.5 py-0.5 text-xs font-medium',
                    level === value ? 'bg-raised text-text' : 'text-muted hover:text-text',
                  )}
                  style={{ left: p.x, top: p.y }}
                >
                  {level}
                </button>
              );
            })
          : null}
    </div>
  );
}
