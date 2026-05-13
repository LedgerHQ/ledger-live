import type { ReactNode } from "react";

type PnlLabeledFieldProps = Readonly<{
  id: string;
  label: string;
  children: ReactNode;
}>;

export function PnlLabeledField({ id, label, children }: PnlLabeledFieldProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <label htmlFor={id} className="body-3 text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
