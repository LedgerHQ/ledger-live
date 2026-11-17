import { TrackScreen } from "@shared/analytics-react";
import React, { useState } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ProfileSection } from "./views/ProfileSection";
import { QuickActionsRow } from "./views/QuickActionsRow";
import { BackupsButton } from "./views/BackupsButton";
import { ContactsButton } from "LLM/features/Contacts";
import { MyLedgerSection } from "./views/MyLedgerSection";
import { ManageAgentsButton } from "./views/ManageAgentsButton";

export function MyWalletScreen() {
  const [isPairing, setIsPairing] = useState(false);

  const onPairingStateChanged = (pairing: boolean) => setIsPairing(pairing);

  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen category="My Wallet" />
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
    </Box>
  );
}
