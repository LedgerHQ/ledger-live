import { ScreenName } from "~/const";

export type WalletSyncNavigatorStackParamList = {
  [ScreenName.WalletSyncActivationSettings]: undefined;

  [ScreenName.WalletSyncSuccess]: {
    created: boolean;
  };

  [ScreenName.WalletSyncActivationProcess]: undefined;
};
