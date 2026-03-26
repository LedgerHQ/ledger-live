import React from "react";

type Props = {
  items: { label: string; color: string }[];
};

export default function ChartLegend({ items }: Props) {
  return (
    <div className="flex flex-row gap-16">
      {items.map(item => (
        <div key={item.label} className="flex flex-row items-center gap-6">
          <div className="h-10 w-10 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="body-3 text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
