import React from "react";
import {
  SelectListItem,
  SelectListItemContent,
  SelectListItemLeading,
  SelectListItemText,
} from "@ledgerhq/lumen-ui-rnative";

import type { AnalyticsFilterItemProps } from "./AnalyticsFilterItem.types";

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
