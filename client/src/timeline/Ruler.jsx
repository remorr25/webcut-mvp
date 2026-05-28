import { useMemo, memo } from 'react';
import useProjectStore from '../store/projectStore';
import { PIXELS_PER_SECOND, pxToSeconds } from './timelineUtils';

const RULER_HEIGHT = 24;

const RulerTicks = memo(function RulerTicks({ ticks, pxPerSecond }) {
  return (
    <>
      {ticks.map(({ s, major }) => {
        const x = s * pxPerSecond;
        return (
          <g key={s}>
            <line
              x1={x} y1={major ? 0 : RULER_HEIGHT * 0.5}
              x2={x} y2={RULER_HEIGHT}
              stroke={major ? '#555' : '#333'}
              strokeWidth={major ? 1 : 0.5}
            />
            {major && (
              <text
                x={x + 3}
                y={RULER_HEIGHT - 6}
                fill="#666"
                fontSize="9"
                fontFamily="Inter, monospace"
                letterSpacing="0"
              >
                {formatRulerTime(s)}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
});

/**
 * Ruler — SVG timecode ruler.
 *
 * @param {{ totalWidth: number, zoom: number }} props
 */
export default function Ruler({ totalWidth, zoom }) {
  const setCurrentTime = useProjectStore(s => s.setCurrentTime);
  const currentTime    = useProjectStore(s => s.currentTime);

  const pxPerSecond = PIXELS_PER_SECOND * zoom;

  /* ── Compute tick marks ── */
  const ticks = useMemo(() => {
    const marks   = [];
    const totalSec = totalWidth / pxPerSecond;
    // Minor ticks every 1 s, major every 5 s
    const step = zoom < 0.7 ? 5 : 1;
    for (let s = 0; s <= Math.ceil(totalSec); s += step) {
      marks.push({ s, major: s % 5 === 0 });
    }
    return marks;
  }, [totalWidth, pxPerSecond, zoom]);

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    setCurrentTime(pxToSeconds(x, zoom));
  }

  return (
    <div
      id="timeline-ruler"
      onClick={handleClick}
      style={{
        height: `${RULER_HEIGHT}px`,
        width:  `${totalWidth}px`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#141414',
        borderBottom: '1px solid #2a2a2a',
        cursor: 'pointer',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <svg width={totalWidth} height={RULER_HEIGHT} style={{ display: 'block' }}>
        <RulerTicks ticks={ticks} pxPerSecond={pxPerSecond} />

        {/* Playhead triangle indicator on ruler */}
        {(() => {
          const px = currentTime * pxPerSecond;
          return (
            <polygon
              points={`${px - 5},0 ${px + 5},0 ${px},8`}
              fill="#ff4444"
              opacity="0.9"
            />
          );
        })()}
      </svg>
    </div>
  );
}

function formatRulerTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`;
  return `${sec}s`;
}

export { RULER_HEIGHT };
