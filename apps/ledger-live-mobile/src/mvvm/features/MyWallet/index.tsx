import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { ProfileSection } from "./views/ProfileSection";
import { QuickActionsRow } from "./views/QuickActionsRow";
import { DeviceSection } from "./views/DeviceSection";
import { MyLedgerSection } from "./views/MyLedgerSection";

export function MyWalletScreen() {
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");
  const [isPairing, setIsPairing] = useState(false);

  const onPairingStateChanged = (pairing: boolean) => setIsPairing(pairing);

  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen category="My Wallet" />
      {!isPairing && (
        <Box lx={{ paddingHorizontal: "s16", gap: "s24", paddingTop: "s16" }}>
          <Box lx={{ alignItems: "center", gap: "s48" }}>
            <ProfileSection />
            <QuickActionsRow />
          </Box>
        </Box>
      )}
      {/* temporary hide the new UI until it's ready */}
      {shouldDisplayMyWallet ? (
        <Box lx={{ paddingTop: "s24" }} style={{ flex: 1 }}>
          <MyLedgerSection onPairingStateChanged={onPairingStateChanged} />
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
