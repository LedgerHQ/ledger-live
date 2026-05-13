import React from "react";

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
};

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between">
      <dt className="body-3 text-muted">{label}</dt>
      <dd className="text-right body-3-semi-bold text-base">{value}</dd>
    </div>
  );
}
