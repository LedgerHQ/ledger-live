import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";

type MyLedgerNavigationParams = {
  device: Device;
  /** Ask My Ledger to open the OS update "What's new" once the updates are resolved. */
  firmwareUpdate?: boolean;
};

type ResetToMyLedgerParams = {
  device?: Device;
};

/**
 * Goes to My Wallet with the device to reconnect to, so that the OS updates path is resolved again.
 */
export function navigateToMyLedger(
  navigation: BaseNavigation,
  { device, firmwareUpdate }: MyLedgerNavigationParams,
) {
  navigation.navigate(NavigatorName.MyWallet, {
    screen: ScreenName.MyWallet,
    params: { device, firmwareUpdate },
  });
}

/**
 * Same as `navigateToMyLedger`, but drops the current stack (e.g. when leaving the OS update).
 * Without a `device`, My Wallet opens with no device selected.
 */
export function resetToMyLedger(navigation: BaseNavigation, { device }: ResetToMyLedgerParams) {
  navigation.reset({
    index: 1,
    routes: [
      { name: NavigatorName.Main },
      {
        name: NavigatorName.MyWallet,
        state: {
          routes: [{ name: ScreenName.MyWallet, params: device ? { device } : {} }],
        },
      },
    ],
  });
}
