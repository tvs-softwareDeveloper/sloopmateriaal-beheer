import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { Material } from "@/types";

const STATUS_COLORS = {
  available: "#10b981",
  reserved: "#f59e0b",
  for_sale: "#3b82f6",
  for_reuse: "#8b5cf6",
  for_disposal: "#64748b",
  sold: "#22c55e",
  disposed: "#ef4444",
};

const TYPE_COLORS = [
  "#1e293b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#f97316",
  "#84cc16",
  "#14b8a6",
];

interface DashboardChartsProps {
  materials: Material[];
  t: (key: string) => string;
}

export default function DashboardCharts({
  materials,
  t,
}: DashboardChartsProps) {
  // same notation as the stat cards, so the currency follows the language
  const money = (value: number) =>
    `${t("currencySymbol")}${value.toLocaleString()}`;

  const statusData = React.useMemo(() => {
    type StatusKey = keyof typeof STATUS_COLORS | "unknown";

    const counts: Record<StatusKey, number> = {
      available: 0,
      reserved: 0,
      for_sale: 0,
      for_reuse: 0,
      for_disposal: 0,
      sold: 0,
      disposed: 0,
      unknown: 0,
    };

    materials.forEach((m) => {
      const status = (m.status || "unknown") as StatusKey;
      counts[status]++;
    });

    // "unknown" only shows up when a material really has no status
    return Object.entries(counts)
      .filter(([name, value]) => name !== "unknown" || value > 0)
      .map(([name, value]) => ({
        name: t(name),
        value,
        color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] ?? "#94a3b8",
      }));
  }, [materials, t]);

const typeData = React.useMemo(() => {
  type MaterialType = Material['material_type'];

  interface TypeData {
    name: string;
    value: number;
    fill: string;
  }

  const counts: Record<MaterialType, number> = {
    wood: 0,
    metal: 0,
    concrete: 0,
    brick: 0,
    glass: 0,
    fixtures: 0,
    appliances: 0,
    roofing: 0,
    plumbing: 0,
    electrical: 0,
    other: 0,
  };

  materials.forEach((m) => {
    const type = (m.material_type ?? "other") as MaterialType;
    counts[type]++;
  });

  return Object.entries(counts)
    .map<TypeData>(([name, value], index) => ({
      name: t(name),
      value: value as number,
      fill: TYPE_COLORS[index % TYPE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}, [materials, t]);


const conditionData = React.useMemo(() => {
  type Condition = NonNullable<Material["condition"]>;

  const order: Condition[] = ["excellent", "good", "fair", "poor"];

  const counts: Record<Condition, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };

  materials.forEach((m) => {
    if (m.condition) {
      counts[m.condition]++;
    }
  });

  return order.map((condition) => ({
    name: t(condition),
    value: counts[condition],
  }));
}, [materials, t]);


const valueByType = React.useMemo(() => {
  type MaterialType = Material["material_type"] | "other";

  const values: Record<MaterialType, number> = {
    wood: 0,
    metal: 0,
    concrete: 0,
    brick: 0,
    glass: 0,
    fixtures: 0,
    appliances: 0,
    roofing: 0,
    plumbing: 0,
    electrical: 0,
    other: 0,
  };

  materials.forEach((m) => {
    if (typeof m.price === "number" && m.price > 0) {
      const type = (m.material_type ?? "other") as MaterialType;
      values[type] += m.price * m.quantity;
    }
  });

  return Object.entries(values)
    .map(([name, value]) => ({
      name: t(name),
      value: Math.round(value),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}, [materials, t]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {t("statusDistribution")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, t("count")]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  formatter={(value) => (
                    <span className="text-xs capitalize">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Materials by Type */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {t("materialsByType")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="value" name={t("count")} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Condition Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {t("conditionBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  name={t("count")}
                  fill="#1e293b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Value by Type */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {t("inventoryValueByType")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueByType}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(v) => money(v)}
                />
                <Tooltip
                  formatter={(value) => [money(Number(value)), t("value")]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
