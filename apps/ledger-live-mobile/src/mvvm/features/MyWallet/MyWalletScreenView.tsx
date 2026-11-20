import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { TrackScreen } from "@shared/analytics-react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactsButton } from "LLM/features/Contacts";
import { ProfileSection } from "./views/ProfileSection";
import { QuickActionsRow } from "./views/QuickActionsRow";
import { BackupsButton } from "./views/BackupsButton";
import { MyLedgerSection } from "./views/MyLedgerSection";
import { ManageAgentsButton } from "./views/ManageAgentsButton";
import type { MyWalletScreenViewProps } from "./useMyWalletScreenViewModel";

export function MyWalletScreenView({
  isPairing,
  onPairingStateChanged,
  isDeviceListEnabled,
}: Readonly<MyWalletScreenViewProps>) {
  const content = (
    <>
      {!isPairing && (
        <Box lx={{ paddingHorizontal: "s16", gap: "s12", paddingTop: "s16" }}>
          <Box lx={{ alignItems: "center", gap: "s48" }}>
            <ProfileSection />
            <QuickActionsRow />
          </Box>
          <BackupsButton />
          <ContactsButton />
          <ManageAgentsButton />
        </Box>
      )}
      <Box lx={{ paddingTop: "s24" }} style={{ flex: 1 }}>
        <MyLedgerSection onPairingStateChanged={onPairingStateChanged} />
      </Box>
    </>
  );

  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen category="My Wallet" />
      {/* The new device list has no scroll of its own: everything below the header scrolls. */}
      {isDeviceListEnabled && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          alwaysBounceVertical={false}
          testID="my-wallet-scroll"
        >
          {content}
        </ScrollView>
      )}
      {!isDeviceListEnabled && content}
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
});
