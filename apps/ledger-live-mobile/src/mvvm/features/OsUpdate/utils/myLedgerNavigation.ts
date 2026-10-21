import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";

type MyLedgerNavigationParams = {
  device: Device;
  shouldDisplayMyWallet: boolean;
  /** Ask My Ledger to open the OS update "What's new" once the updates are resolved. */
  firmwareUpdate?: boolean;
};

type ResetToMyLedgerParams = {
  device?: Device;
  shouldDisplayMyWallet: boolean;
};

/**
 * Goes to the My Ledger connection screen with the device to reconnect to, so that the OS
 * updates path is resolved again. Which screen it is depends on the Wallet 4.0 config.
 */
export function navigateToMyLedger(
  navigation: BaseNavigation,
  { device, shouldDisplayMyWallet, firmwareUpdate }: MyLedgerNavigationParams,
) {
  const params = { device, firmwareUpdate };
  if (shouldDisplayMyWallet) {
    navigation.navigate(NavigatorName.MyWallet, {
      screen: ScreenName.MyWallet,
      params,
    });
  } else {
    navigation.navigate(NavigatorName.MyLedger, {
      screen: ScreenName.MyLedgerChooseDevice,
      params,
    });
  }
}

/**
 * Same as `navigateToMyLedger`, but drops the current stack (e.g. when leaving the OS update).
 * Without a `device`, My Ledger opens with no device selected.
 */
export function resetToMyLedger(
  navigation: BaseNavigation,
  { device, shouldDisplayMyWallet }: ResetToMyLedgerParams,
) {
  if (shouldDisplayMyWallet) {
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
    return;
  }

  navigation.reset({
    index: 1,
    routes: [
      { name: NavigatorName.Main },
      {
        name: NavigatorName.MyLedger,
        state: {
          routes: [
            {
              name: ScreenName.MyLedgerChooseDevice,
              params: device ? { device } : {},
            },
          ],
        },
      },
    ],
  });
}
