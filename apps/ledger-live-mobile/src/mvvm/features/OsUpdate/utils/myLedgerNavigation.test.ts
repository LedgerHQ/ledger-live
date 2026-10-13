import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { navigateToMyLedger, resetToMyLedger } from "./myLedgerNavigation";

const device = { deviceId: "usb|1" } as Device;
const createNavigation = () =>
  ({ navigate: jest.fn(), reset: jest.fn() }) as unknown as jest.Mocked<BaseNavigation>;

describe("navigateToMyLedger", () => {
  it("navigates to the Wallet 4.0 My Wallet screen", () => {
    const navigation = createNavigation();

    navigateToMyLedger(navigation, { device, shouldDisplayMyWallet: true, firmwareUpdate: true });

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      screen: ScreenName.MyWallet,
      params: { device, firmwareUpdate: true },
    });
  });

  it("navigates to the legacy My Ledger device selection", () => {
    const navigation = createNavigation();

    navigateToMyLedger(navigation, { device, shouldDisplayMyWallet: false, firmwareUpdate: true });

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.MyLedger, {
      screen: ScreenName.MyLedgerChooseDevice,
      params: { device, firmwareUpdate: true },
    });
  });
});

describe("resetToMyLedger", () => {
  it("resets to the Wallet 4.0 My Wallet screen with the device to reconnect", () => {
    const navigation = createNavigation();

    resetToMyLedger(navigation, { device, shouldDisplayMyWallet: true });

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        { name: NavigatorName.Main },
        {
          name: NavigatorName.MyWallet,
          state: { routes: [{ name: ScreenName.MyWallet, params: { device } }] },
        },
      ],
    });
  });

  it("resets to the legacy My Ledger device selection with the device to reconnect", () => {
    const navigation = createNavigation();

    resetToMyLedger(navigation, { device, shouldDisplayMyWallet: false });

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        { name: NavigatorName.Main },
        {
          name: NavigatorName.MyLedger,
          state: { routes: [{ name: ScreenName.MyLedgerChooseDevice, params: { device } }] },
        },
      ],
    });
  });
});
