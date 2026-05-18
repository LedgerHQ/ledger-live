import React from "react";

export type StatRowProps = Readonly<{
  label: string;
  value: string;
}>;

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex flex-row items-start justify-between gap-16">
      <span className="body-2 text-muted">{label}</span>
      <span className="body-2-semi-bold text-base text-right">{value}</span>
    </div>
  );
}
