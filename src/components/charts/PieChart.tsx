"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PieChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#c026d3"];

export function PieChart({ data, height = 300 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px"
          }}
          formatter={(value: number) => [
            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value,
            "Value"
          ]}
        />
        <Legend 
          layout="vertical" 
          align="right" 
          verticalAlign="middle"
          iconType="circle"
          iconSize={10}
          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
