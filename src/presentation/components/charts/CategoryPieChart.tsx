"use client";

import { useState } from "react";

import { CategorySlice } from "@/presentation/lib/chart-data";
import { formatCurrency } from "@/presentation/lib/formatters";

/** Validated 8-hue categorical order (dataviz skill default) — fixed order, never cycled. */
const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER_R = 92;
const INNER_R = 56;
const GAP_ANGLE = (2 * Math.PI) / 180; // ~1deg surface gap between slices

function toXY(angle: number, radius: number): [number, number] {
  return [CENTER + radius * Math.sin(angle), CENTER - radius * Math.cos(angle)];
}

function arcPath(startAngle: number, endAngle: number): string {
  const [x1, y1] = toXY(startAngle, OUTER_R);
  const [x2, y2] = toXY(endAngle, OUTER_R);
  const [x3, y3] = toXY(endAngle, INNER_R);
  const [x4, y4] = toXY(startAngle, INNER_R);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

export function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const fractions = data.map((slice) => (total > 0 ? slice.value / total : 0));
  const boundaries = fractions.reduce<number[]>((acc, fraction, index) => [...acc, (acc[index - 1] ?? 0) + fraction], []);

  const slices = data.map((slice, index) => {
    const startAngle = (index === 0 ? 0 : boundaries[index - 1]) * 2 * Math.PI + GAP_ANGLE / 2;
    const endAngle = boundaries[index] * 2 * Math.PI - GAP_ANGLE / 2;
    return {
      ...slice,
      index,
      color: PALETTE[index % PALETTE.length],
      path: endAngle > startAngle ? arcPath(startAngle, endAngle) : "",
      percentage: fractions[index] * 100,
    };
  });

  const hovered = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="Despesas por categoria no mês">
          {slices.map((slice) => (
            <path
              key={slice.name}
              d={slice.path}
              fill={slice.color}
              opacity={hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.55}
              tabIndex={0}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(slice.index)}
              onBlur={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs text-ink-500">{hovered ? hovered.name : "Total"}</p>
          <p className="text-sm font-semibold text-ink-900">{formatCurrency(hovered ? hovered.value : total)}</p>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1.5 sm:max-w-[220px]">
        {slices.map((slice) => (
          <li
            key={slice.name}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-ink-50"
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="flex min-w-0 items-center gap-2 text-ink-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="shrink-0 font-medium text-ink-900">
              {formatCurrency(slice.value)} <span className="text-ink-400">({slice.percentage.toFixed(0)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
