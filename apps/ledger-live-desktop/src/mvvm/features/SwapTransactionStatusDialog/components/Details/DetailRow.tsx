import React from "react";

type DetailRowProps = Readonly<{
  label: string;
  value: React.ReactNode;
  testId?: string;
}>;

export function DetailRow({ label, value, testId }: DetailRowProps) {
  return (
    <>
      <dt className="whitespace-nowrap body-3 text-muted">{label}</dt>
      <dd
        data-testid={testId}
        className="min-w-0 justify-self-end text-right body-3-semi-bold text-base"
      >
        {value}
      </dd>
    </>
  );
}
