import type { KeyRingMember } from "@features/platform-key-ring";
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
        seededOffer?: boolean;
      };
  [ScreenName.WalletSyncActivated]: undefined;

  [ScreenName.WalletSyncManageKeyDeleteSuccess]: undefined;
  [ScreenName.WalletSyncUnSynchSuccess]: undefined;

  [ScreenName.WalletSyncManageInstancesProcess]: {
    member: KeyRingMember;
  };

  [ScreenName.WalletSyncManageInstancesSuccess]: {
    member: KeyRingMember;
  };
};
