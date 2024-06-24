import { getSdk } from "@ledgerhq/trustchain/index";
import { Flow, initialStateWalletSync, Step } from "~/renderer/reducers/walletSync";

export const mockedSdk = getSdk(true, {
  applicationId: 12,
  name: "LLD Integration",
});

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
