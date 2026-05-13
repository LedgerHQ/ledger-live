import React from "react";

type DetailRowProps = Readonly<{
  label: string;
  value: React.ReactNode;
}>;

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <>
      <dt className="body-3 text-muted">{label}</dt>
      <dd className="text-right body-3-semi-bold text-base">{value}</dd>
    </>
  );
}
