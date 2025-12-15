import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { ScreenName } from "~/const";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export type WalletSyncNavigatorStackParamList = {
  [ScreenName.WalletSyncActivationInit]: undefined;

  [ScreenName.WalletSyncSuccess]: {
    created: boolean;
  };

  [ScreenName.WalletSyncLoading]: {
    created: boolean;
  };

  [ScreenName.WalletSyncActivationProcess]:
    | undefined
    | {
        device?: Device;
      };
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
