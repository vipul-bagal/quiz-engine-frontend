export default function ConsistencyPulse({ results = [], classification, width = 120, height = 36 }) {
  const colorMap = {
    MASTERED: 'var(--color-accent)',
    GUESSED: 'var(--color-warn)',
    NOT_UNDERSTOOD: 'var(--color-danger)',
    INSUFFICIENT_DATA: 'var(--color-text-faint)',
  };
  const color = colorMap[classification] || 'var(--color-text-faint)';

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

  const pathD = coords.length === 1
    ? `M ${coords[0][0] - segmentWidth * 0.3} ${coords[0][1]} L ${coords[0][0] + segmentWidth * 0.3} ${coords[0][1]}`
    : coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0]} ${c[1]}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={color} />
      ))}
    </svg>
  );
}
