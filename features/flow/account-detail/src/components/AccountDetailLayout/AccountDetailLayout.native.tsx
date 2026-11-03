import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { AccountDetailLayoutProps } from "./AccountDetailLayout.types";

export function AccountDetailLayout({
  hero,
  customPlace,
  analyticsNotice,
  assets,
  transactions,
}: AccountDetailLayoutProps) {
  return (
    <Box lx={{ flexDirection: "column", gap: "s24" }} testID="account-detail-layout">
      {hero}
      {customPlace}
      {analyticsNotice}
      {assets}
      {transactions}
    </Box>
  );
}
