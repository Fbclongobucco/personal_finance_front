"use client";

import { useState } from "react";

import { MonthlyPoint } from "@/presentation/lib/chart-data";
import { formatCurrency } from "@/presentation/lib/formatters";

const WIDTH = 600;
const HEIGHT = 280;
const MARGIN = { top: 16, right: 12, bottom: 32, left: 54 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const TICKS = [0, 0.25, 0.5, 0.75, 1];

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 1,
  }).format(value);
}

type Series = "income" | "expense";

export function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  const [hovered, setHovered] = useState<{ monthIndex: number; series: Series } | null>(null);

  const maxValue = niceMax(Math.max(1, ...data.flatMap((point) => [point.income, point.expense])));
  const groupWidth = PLOT_WIDTH / Math.max(1, data.length);
  const barWidth = Math.min(22, groupWidth / 2 - 6);
  const baseline = MARGIN.top + PLOT_HEIGHT;

  const yFor = (value: number) => baseline - (value / maxValue) * PLOT_HEIGHT;

  const hoveredValue = hovered ? data[hovered.monthIndex][hovered.series] : null;
  const hoveredLeft = hovered
    ? ((MARGIN.left + (hovered.monthIndex + 0.5) * groupWidth) / WIDTH) * 100
    : 0;
  const hoveredTop = hovered && hoveredValue !== null ? (yFor(hoveredValue) / HEIGHT) * 100 : 0;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Receitas e despesas por mês">
          {TICKS.map((fraction) => {
            const value = fraction * maxValue;
            const y = yFor(value);
            return (
              <g key={fraction}>
                <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} className="stroke-ink-100" strokeWidth={1} />
                <text x={MARGIN.left - 8} y={y + 3} textAnchor="end" fontSize={10} className="fill-ink-400">
                  {formatCompact(value)}
                </text>
              </g>
            );
          })}

          {data.map((point, index) => {
            const groupX = MARGIN.left + index * groupWidth;
            const incomeX = groupX + groupWidth / 2 - barWidth - 2;
            const expenseX = groupX + groupWidth / 2 + 2;
            const incomeHeight = (point.income / maxValue) * PLOT_HEIGHT;
            const expenseHeight = (point.expense / maxValue) * PLOT_HEIGHT;

            const dim = (series: Series) => (hovered && !(hovered.monthIndex === index && hovered.series === series) ? 0.55 : 1);

            return (
              <g key={point.key}>
                <rect
                  x={incomeX}
                  y={baseline - incomeHeight}
                  width={barWidth}
                  height={Math.max(incomeHeight, incomeHeight > 0 ? 1 : 0)}
                  rx={4}
                  className="fill-money-600"
                  opacity={dim("income")}
                  tabIndex={0}
                  onMouseEnter={() => setHovered({ monthIndex: index, series: "income" })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ monthIndex: index, series: "income" })}
                  onBlur={() => setHovered(null)}
                />
                <rect
                  x={expenseX}
                  y={baseline - expenseHeight}
                  width={barWidth}
                  height={Math.max(expenseHeight, expenseHeight > 0 ? 1 : 0)}
                  rx={4}
                  className="fill-brand-700"
                  opacity={dim("expense")}
                  tabIndex={0}
                  onMouseEnter={() => setHovered({ monthIndex: index, series: "expense" })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ monthIndex: index, series: "expense" })}
                  onBlur={() => setHovered(null)}
                />
                <text x={groupX + groupWidth / 2} y={HEIGHT - 10} textAnchor="middle" fontSize={11} className="fill-ink-500">
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && hoveredValue !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-ink-100 bg-white px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: `${hoveredLeft}%`, top: `${hoveredTop}%` }}
          >
            <p className="font-semibold text-ink-900">{formatCurrency(hoveredValue)}</p>
            <p className="text-ink-500">
              {hovered.series === "income" ? "Receitas" : "Despesas"} · {data[hovered.monthIndex].label}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-ink-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-money-600" /> Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-700" /> Despesas
        </span>
      </div>
    </div>
  );
}
