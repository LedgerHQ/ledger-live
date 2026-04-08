import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ProfileSection } from "./views/ProfileSection";
import { QuickActionsRow } from "./views/QuickActionsRow";

export function MyWalletScreen() {
  return (
    <Box style={{ flex: 1 }}>
      <ProfileSection />
      <Box lx={{ paddingHorizontal: "s16", marginTop: "s24" }}>
        <QuickActionsRow />
      </Box>
    </Box>
  );
}
