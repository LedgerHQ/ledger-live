import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type MyWalletNavigatorStackParamList = {
  [ScreenName.MyWallet]: { device?: Device } | undefined;
  [ScreenName.MyWalletHelp]: undefined;
};
