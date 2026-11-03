import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { AccountDetailLayoutProps } from "./AccountDetailLayout.types";

export function AccountDetailLayout({
  hero,
  analyticsNotice,
  customPlace,
  assets,
  transactions,
}: AccountDetailLayoutProps) {
  return (
    <Box lx={{ flexDirection: "column", gap: "s24" }} testID="account-detail-layout">
      {hero}
      {analyticsNotice}
      {customPlace}
      {assets}
      {transactions}
    </Box>
  );
}
