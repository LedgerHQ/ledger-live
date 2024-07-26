import { getSdk } from "@ledgerhq/trustchain/index";
import { EMPTY } from "rxjs";
import { Flow, initialStateWalletSync, Step } from "~/renderer/reducers/walletSync";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export const mockedSdk = getSdk(
  true,
  {
    applicationId: 12,
    name: "LLD Integration",
    apiBaseUrl: getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl,
  },
  { withDevice: () => () => EMPTY, deviceId$: EMPTY, isMockEnv: true },
);

export const walletSyncActivatedState = {
  ...initialStateWalletSync,
  flow: Flow.WalletSyncActivated,
  step: Step.WalletSyncActivated,
};

export const simpleTrustChain = {
  rootId: "rootId",
  deviceId: "deviceId",
  trustchainId: "trustchainId",
};
