/**
 * The signature visual element of the app: a small waveform that represents
 * whether a student's answers across concept variants were CONSISTENT
 * (flat, steady line = mastered or not-understood) or ERRATIC (a spike =
 * guessed — correct on one variant, wrong on another). This isn't
 * decoration; the shape is derived directly from the actual results array.
 *
 * results: array of booleans, e.g. [true, false] or [true] or [true, true]
 * classification: 'MASTERED' | 'GUESSED' | 'NOT_UNDERSTOOD' | 'INSUFFICIENT_DATA'
 */
export default function ConsistencyPulse({ results = [], classification, width = 120, height = 36 }) {
  const colorMap = {
    MASTERED: 'var(--color-accent)',
    GUESSED: 'var(--color-warn)',
    NOT_UNDERSTOOD: 'var(--color-danger)',
    INSUFFICIENT_DATA: 'var(--color-text-faint)',
  };
  const color = colorMap[classification] || 'var(--color-text-faint)';

  // Build a simple line path: correct -> high point, incorrect -> low point.
  // A single result still draws a short flat segment at the appropriate height.
  const points = results.length > 0 ? results : [null];
  const segmentWidth = width / Math.max(points.length, 1);
  const highY = height * 0.22;
  const lowY = height * 0.78;
  const midY = height * 0.5;

  const coords = points.map((correct, i) => {
    const x = segmentWidth * (i + 0.5);
    const y = correct === null ? midY : correct ? highY : lowY;
    return [x, y];
  });

  // If there's only one point, draw a short flat dash instead of a dot,
  // so "insufficient data" still reads as a line, just a shorter one.
  const pathD = coords.length === 1
    ? `M ${coords[0][0] - segmentWidth * 0.3} ${coords[0][1]} L ${coords[0][0] + segmentWidth * 0.3} ${coords[0][1]}`
    : coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0]} ${c[1]}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={color} />
      ))}
    </svg>
  );
}
