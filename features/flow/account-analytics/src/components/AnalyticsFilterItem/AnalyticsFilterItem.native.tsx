import React, { type ReactNode } from "react";
import {
  SelectListItem,
  SelectListItemContent,
  SelectListItemLeading,
  SelectListItemText,
} from "@ledgerhq/lumen-ui-rnative";

type AnalyticsFilterItemProps = Readonly<{
  value: string;
  label: string;
  icon: ReactNode;
  description?: string;
  testID: string;
}>;

export function AnalyticsFilterItem({
  value,
  label,
  icon,
  description,
  testID,
}: AnalyticsFilterItemProps) {
  return (
    <SelectListItem
      value={value}
      testID={testID}
      accessibilityLabel={description ? `${label} (${description})` : label}
    >
      <SelectListItemLeading>{icon}</SelectListItemLeading>
      <SelectListItemContent>
        <SelectListItemText>{label}</SelectListItemText>
      </SelectListItemContent>
    </SelectListItem>
  );
}
