import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import LedgerSyncEntryPoint from "..";
import { EntryPoint } from "../types";
import { useActivationDrawer } from "../hooks/useActivationDrawer";
import { AnalyticsPage } from "../../WalletSync/hooks/useLedgerSyncAnalytics";
import WalletSyncDrawer from "../../WalletSync/components/Drawer";
import { withFlagOverrides } from "tests/testSetup";

export const INITIAL_STATE = {
  settings: {
    readOnlyModeEnabled: false,
    lastSeenDevice: {
      modelId: DeviceModelId.stax,
    } as DeviceModelInfo,
  },
  ...withFlagOverrides({
    lldWalletSync: {
      enabled: true,
      params: {
        environment: "STAGING" as const,
        watchConfig: {},
      },
    },
    lldLedgerSyncEntryPoints: {
      enabled: true,
      params: {
        onboarding: true,
        manager: true,
        accounts: true,
        settings: true,
        postOnboarding: true,
      },
    },
  }),
  trustchain: {
    trustchain: null,
    memberCredentials: null,
  },
};

export const LedgerSyncEntryPointShared = ({
  entryPoint,
  needEligibleDevice,
  variant,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  variant?: "v4";
}) => {
  const { closeDrawer } = useActivationDrawer();

  return (
    <>
      <div id="modals"></div>
      <LedgerSyncEntryPoint
        entryPoint={entryPoint}
        needEligibleDevice={needEligibleDevice}
        variant={variant}
      />
      <WalletSyncDrawer currentPage={AnalyticsPage.SettingsGeneral} onClose={closeDrawer} />
    </>
  );
};
