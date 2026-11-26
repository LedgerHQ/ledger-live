import React from "react";
import {
  createKeyRingClient,
  KeyRingMemberIdSchema,
  type KeyRingMember,
} from "@features/platform-key-ring";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { Flow, initialStateWalletSync, Step } from "~/renderer/reducers/walletSync";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import { useActivationDrawer } from "../../LedgerSyncEntryPoints/hooks/useActivationDrawer";
import WalletSyncDrawer from "../components/Drawer";
import { keyRingDeviceBridge } from "../keyRingDeviceBridge";

export const INSTANCES: Array<KeyRingMember> = [
  {
    id: KeyRingMemberIdSchema.parse("currentInstance"),
    name: "macOS",
  },
  {
    id: KeyRingMemberIdSchema.parse("2"),
    name: "Ipone 15",
  },
];

export const lldWalletSyncFeatureFlag = {
  lldWalletSync: {
    enabled: true,
    params: {
      environment: "STAGING" as const,
      watchConfig: {
        pollingInterval: 10000,
        initialTimeout: 5000,
        userIntentDebounce: 1000,
      },
      learnMoreLink: "https://www.ledger.com",
    },
  },
};

export const mockedSdk = createKeyRingClient({
  mock: true,
  instanceName: "LLD Integration",
  apiBaseUrl: getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl,
  deviceBridge: keyRingDeviceBridge,
});

export const walletSyncActivatedState = {
  ...initialStateWalletSync,
  flow: Flow.LedgerSyncActivated,
  step: Step.LedgerSyncActivated,
};

export const simpleTrustChain = {
  rootId: "rootId",
  deviceId: "deviceId",
  trustchainId: "trustchainId",
};

export const WalletSyncTestApp = () => {
  const { closeDrawer } = useActivationDrawer();
  return (
    <>
      <div id="modals"></div>
      <WalletSyncRow />
      <WalletSyncDrawer currentPage={AnalyticsPage.SettingsGeneral} onClose={closeDrawer} />
    </>
  );
};
