import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { AccountAnalyticsSections } from "./AccountAnalyticsSections";
import type { AccountAnalyticsViewProps } from "./AccountAnalytics.types";

export function AccountAnalyticsView(props: AccountAnalyticsViewProps) {
  return (
    <Box lx={{ flexDirection: "column", gap: "s24" }} testID="account-analytics">
      <AccountAnalyticsSections {...props} />
    </Box>
  );
}
