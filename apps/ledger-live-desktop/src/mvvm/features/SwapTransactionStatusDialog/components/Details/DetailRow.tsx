import React from "react";

type DetailRowProps = Readonly<{
  label: string;
  value: React.ReactNode;
}>;

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <>
      <dt className="whitespace-nowrap body-3 text-muted">{label}</dt>
      <dd className="min-w-0 justify-self-end text-right body-3-semi-bold text-base">{value}</dd>
    </>
  );
}
