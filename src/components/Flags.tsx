export function FlagKR({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 30 21" role="img" aria-label="KR">
      <rect width="30" height="21" rx="2" fill="#fff" />
      <circle cx="15" cy="10.5" r="5" fill="#c60c30" />
      <path d="M15 5.5a5 5 0 0 1 0 10 2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 0 0-5z" fill="#003478" />
      <g stroke="#000" strokeWidth="0.9">
        <path d="M3 4h4M3 5.5h4M3 7h4" />
        <path d="M3 14h4M3 15.5h4M3 17h4" />
        <path d="M23 4h4M23 5.5h4M23 7h4" />
        <path d="M23 14h1.3M25.7 14H27M23 15.5h4M23 17h1.3M25.7 17H27" />
      </g>
    </svg>
  );
}

export function FlagUS({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 30 21" role="img" aria-label="US">
      <rect width="30" height="21" rx="2" fill="#fff" />
      <g fill="#b22234">
        {[0, 2, 4, 6, 8, 10, 12].map((y) => (
          <rect key={y} y={y * 1.615} width="30" height="1.615" />
        ))}
      </g>
      <rect width="13" height="11.3" fill="#3c3b6e" />
    </svg>
  );
}

export function FlagJP({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 30 21" role="img" aria-label="JP">
      <rect width="30" height="21" rx="2" fill="#fff" />
      <circle cx="15" cy="10.5" r="6" fill="#bc002d" />
    </svg>
  );
}
