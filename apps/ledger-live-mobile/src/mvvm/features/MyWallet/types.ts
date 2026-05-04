import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type MyWalletNavigatorStackParamList = {
  [ScreenName.MyWallet]:
    | {
        device?: Device;
        firmwareUpdate?: boolean;
        searchQuery?: string;
        installApp?: string;
      }
    | undefined;
  [ScreenName.MyWalletHelp]: undefined;
};
