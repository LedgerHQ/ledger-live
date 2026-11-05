import React, { type ReactNode } from "react";
import { SelectItem, SelectItemText } from "@ledgerhq/lumen-ui-react";

type AnalyticsFilterItemProps = Readonly<{
  value: string;
  label: string;
  icon: ReactNode;
  description?: string;
}>;

export function AnalyticsFilterItem({ value, label, icon, description }: AnalyticsFilterItemProps) {
  return (
    <SelectItem
      value={value}
      className="min-h-40 data-highlighted:aria-selected:bg-base-transparent focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span className="flex size-24 shrink-0 items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <SelectItemText className="min-w-0 flex-1 overflow-visible text-clip whitespace-normal wrap-anywhere">
        {label}
        {description && <span className="sr-only"> ({description})</span>}
      </SelectItemText>
    </SelectItem>
  );
}
