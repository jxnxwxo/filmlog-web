"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
}

function Star({ fill }: { fill: number }) {
  // fill: 0 (empty), 0.5 (half), 1 (full)
  const id = `star-clip-${Math.random().toString(36).slice(2)}`;
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * fill} height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z"
        fill="none"
        stroke="var(--text-faint)"
        strokeWidth="1.2"
      />
      <path
        d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z"
        fill="var(--accent)"
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}

export default function StarRating({ value, onChange, size = 28 }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  function pick(starIndex: number, e: React.MouseEvent | React.TouchEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const isLeftHalf = clientX - rect.left < rect.width / 2;
    const newValue = starIndex + (isLeftHalf ? 0.5 : 1);
    onChange(newValue);
  }

  function previewAt(starIndex: number, e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHover(starIndex + (isLeftHalf ? 0.5 : 1));
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "inline-flex", gap: 4 }} onMouseLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, display - i));
          return (
            <div
              key={i}
              style={{ width: size, height: size, cursor: "pointer", touchAction: "manipulation" }}
              onMouseMove={(e) => previewAt(i, e)}
              onClick={(e) => pick(i, e)}
              onTouchEnd={(e) => pick(i, e)}
            >
              <Star fill={fill} />
            </div>
          );
        })}
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-dim)", minWidth: 32 }}>
        {value != null ? value.toFixed(1) : "—"}
      </span>
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-faint)",
            fontSize: 12,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          지우기
        </button>
      )}
    </div>
  );
}
