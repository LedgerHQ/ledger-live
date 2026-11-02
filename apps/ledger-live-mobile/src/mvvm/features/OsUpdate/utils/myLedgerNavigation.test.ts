import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { navigateToMyLedger, resetToMyLedger } from "./myLedgerNavigation";

const device = { deviceId: "usb|1" } as Device;
const createNavigation = () =>
  ({ navigate: jest.fn(), reset: jest.fn() }) as unknown as jest.Mocked<BaseNavigation>;

describe("navigateToMyLedger", () => {
  it("navigates to My Wallet", () => {
    const navigation = createNavigation();

    navigateToMyLedger(navigation, { device, firmwareUpdate: true });

    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      screen: ScreenName.MyWallet,
      params: { device, firmwareUpdate: true },
    });
  });
});

describe("resetToMyLedger", () => {
  it("resets to My Wallet with the device to reconnect", () => {
    const navigation = createNavigation();

    resetToMyLedger(navigation, { device });

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
});
