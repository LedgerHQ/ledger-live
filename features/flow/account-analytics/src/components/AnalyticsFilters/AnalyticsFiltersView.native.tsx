import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { AnalyticsFilterSelect } from "../AnalyticsFilterSelect/AnalyticsFilterSelect";
import type { AnalyticsFiltersViewProps } from "./AnalyticsFiltersView.types";

export function AnalyticsFiltersView({ asset, account }: AnalyticsFiltersViewProps) {
  return (
    <Box
      lx={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: "s12" }}
      testID="account-analytics-filters"
    >
      <AnalyticsFilterSelect variant="asset" {...asset} />
      {account && <AnalyticsFilterSelect variant="account" {...account} />}
    </Box>
  );
}
