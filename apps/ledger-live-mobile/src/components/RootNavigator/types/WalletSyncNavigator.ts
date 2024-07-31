import { ScreenName } from "~/const";

export type WalletSyncNavigatorStackParamList = {
  [ScreenName.WalletSyncActivationInit]: undefined;

  [ScreenName.WalletSyncSuccess]: {
    created: boolean;
  };

  [ScreenName.WalletSyncActivationProcess]: undefined;
  [ScreenName.WalletSyncActivated]: undefined;

  [ScreenName.WalletSyncManageKeyDeleteSuccess]: undefined;
  [ScreenName.WalletSyncUnSynchSuccess]: undefined;
};
