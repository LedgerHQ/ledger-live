import React from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { ProfileSection } from "./views/ProfileSection";
import { QuickActionsRow } from "./views/QuickActionsRow";
import { DeviceSection } from "./views/DeviceSection";

export function MyWalletScreen() {
  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen category="My Wallet" />
      <ScrollView>
        <Box lx={{ paddingHorizontal: "s16", gap: "s24", paddingBottom: "s24" }}>
          <ProfileSection />
          <QuickActionsRow />
          <DeviceSection />
        </Box>
      </ScrollView>
    </Box>
  );
}
