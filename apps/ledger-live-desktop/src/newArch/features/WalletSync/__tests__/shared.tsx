import React from "react";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { getSdk } from "@ledgerhq/trustchain/index";
import { EMPTY } from "rxjs";
import { Flow, initialStateWalletSync, Step } from "~/renderer/reducers/walletSync";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export const INSTANCES: Array<TrustchainMember> = [
  {
    id: "currentInstance",
    name: "macOS",
    permissions: 112,
  },
  {
    id: "2",
    name: "Ipone 15",
    permissions: 112,
  },
];

export const lldWalletSyncFeatureFlag = {
  lldWalletSync: {
    enabled: true,
    params: {
      environment: "STAGING",
      watchConfig: {
        pollingInterval: 10000,
        initialTimeout: 5000,
        userIntentDebounce: 1000,
      },
      learnMoreLink: "https://www.ledger.com",
    },
  },
};

export const mockedSdk = getSdk(
  true,
  {
    applicationId: 12,
    name: "LLD Integration",
    apiBaseUrl: getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl,
  },
  () => () => EMPTY,
);

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

export const WalletSyncTestApp = () => (
  <>
    <div id="modals"></div>
    <WalletSyncRow />
  </>
);
