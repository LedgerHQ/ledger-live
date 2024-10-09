import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { ScreenName } from "~/const";

export type WalletSyncNavigatorStackParamList = {
  [ScreenName.LedgerSyncDeepLinkHandler]: undefined;

  [ScreenName.WalletSyncActivationInit]: undefined;

  [ScreenName.WalletSyncSuccess]: {
    created: boolean;
  };

  [ScreenName.WalletSyncLoading]: {
    created: boolean;
  };

  [ScreenName.WalletSyncActivationProcess]: undefined;
  [ScreenName.WalletSyncActivated]: undefined;

  [ScreenName.WalletSyncManageKeyDeleteSuccess]: undefined;
  [ScreenName.WalletSyncUnSynchSuccess]: undefined;

  [ScreenName.WalletSyncManageInstancesProcess]: {
    member: TrustchainMember;
  };

  [ScreenName.WalletSyncManageInstancesSuccess]: {
    member: TrustchainMember;
  };
};
