import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyPoint } from "@/services/analyticsService";

const axis = {
  stroke: "var(--tt-text-soft)",
  fontSize: 12,
  fontFamily: "var(--font-sans)",
};

export function AccuracyTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="ttAccuracy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--tt-forest)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--tt-forest)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--tt-cream-deep)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} {...axis} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} {...axis} />
          <Tooltip cursor={{ fill: "var(--tt-cream-deep)", opacity: 0.5 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontFamily: "var(--font-sans)",
            }}
            formatter={(v: number) => [`${v}%`, "Accuracy"]}
          />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="var(--tt-forest)"
            strokeWidth={3}
            fill="url(#ttAccuracy)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PracticeMinutesChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--tt-cream-deep)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} {...axis} />
          <YAxis tickLine={false} axisLine={false} {...axis} />
          <Tooltip cursor={{ fill: "var(--tt-cream-deep)", opacity: 0.5 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontFamily: "var(--font-sans)",
            }}
            formatter={(v: number) => [`${v} min`, "Practice"]}
          />
          <Bar dataKey="minutes" fill="var(--tt-sky-deep)" radius={[6, 6, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
