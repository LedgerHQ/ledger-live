import React from "react";
import { Switch } from "@ledgerhq/lumen-ui-react";

export type AnalyticsConsentPreferenceRowProps = Readonly<{
  title: React.ReactNode;
  description: React.ReactNode;
  selected: boolean;
  onChange: (value: boolean) => void;
}>;

export function AnalyticsConsentPreferenceRow({
  title,
  description,
  selected,
  onChange,
}: AnalyticsConsentPreferenceRowProps) {
  return (
    <div className="flex w-full flex-col gap-12">
      <div className="flex w-full items-center justify-between gap-12 rounded-lg bg-muted px-10 py-16 dark:bg-surface">
        <span className="body-2-semi-bold text-base">{title}</span>
        <Switch selected={selected} onChange={onChange} />
      </div>
      <p className="body-3 text-muted px-2">{description}</p>
    </div>
  );
}
