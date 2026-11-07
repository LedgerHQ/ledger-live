import React from "react";

type Props = Readonly<{ label: string; value: string; testID: string }>;

export function SummaryRow({ label, value, testID }: Props) {
  return (
    <div className="flex items-start justify-between gap-16">
      <span className="body-2 text-muted">{label}</span>
      <span className="body-2-semi-bold text-base text-right break-all" data-testid={testID}>
        {value}
      </span>
    </div>
  );
}
