import React from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { ProfileSection } from "./views/ProfileSection";
import { QuickActionsRow } from "./views/QuickActionsRow";
import { DeviceSection } from "./views/DeviceSection";
import { MyLedgerSection } from "./views/MyLedgerSection";

export function MyWalletScreen() {
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen category="My Wallet" />
      <Box lx={{ paddingHorizontal: "s16", gap: "s24", paddingTop: "s24" }}>
        <ProfileSection />
        <QuickActionsRow />
      </Box>
      {shouldDisplayMyWallet ? (
        <Box lx={{ paddingTop: "s24" }} style={{ flex: 1 }}>
          <MyLedgerSection />
        </Box>
      ) : (
        <ScrollView>
          <Box lx={{ paddingHorizontal: "s16", gap: "s24", paddingBottom: "s24" }}>
            <DeviceSection />
          </Box>
        </ScrollView>
      )}
    </Box>
  );
}
