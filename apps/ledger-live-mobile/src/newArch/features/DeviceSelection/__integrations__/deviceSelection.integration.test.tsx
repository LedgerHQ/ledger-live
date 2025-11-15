import * as React from "react";
import { render, screen } from "@tests/test-renderer";
import DeviceSelectionNavigator from "../Navigator";
import { useRoute, useNavigation } from "@react-navigation/native";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { of } from "rxjs";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";

const MockUseRoute = useRoute as jest.Mock;
const mockNavigate = jest.fn();
const mockDiscoverDevices = discoverDevices as jest.Mock;

(useNavigation as jest.Mock).mockReturnValue({
  navigate: mockNavigate,
  addListener: jest.fn(),
});

jest.mock("@ledgerhq/live-common/deposit/index", () => ({
  useGroupedCurrenciesByProvider: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hw/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn(),
}));

describe("Device Selection feature integration test", () => {
  beforeAll(() => {
    MockUseRoute.mockReturnValue({
      params: {
        context: AddAccountContexts.AddAccounts,
        currency: {
          type: "CryptoCurrency",
          id: "bitcoin",
          ticker: "BTC",
          name: "Bitcoin",
          family: "bitcoin",
          color: "#ffae35",
          decimals: 8,
          managerAppName: "Bitcoin",
        },
      },
    });
  });
  it("should render a device connection screen when no device is installed", () => {
    mockDiscoverDevices.mockReturnValue(of({}));
    render(<DeviceSelectionNavigator />);

    /**
     * Note: Header elements with custom React components (via headerTitle: () => <Component />)
     * are rendered TWICE by @react-navigation/native-stack:
     *
     * 1. Once in RNSScreenStackHeaderConfig (native header config, hidden but in DOM)
     * 2. Once in RNSScreenContentWrapper (visible React component tree)
     *
     * This is by design to bridge React components with native navigation performance.
     * In tests, both instances exist in the component tree, causing "multiple elements found" errors
     * when using getBy* queries.
     *
     * Solution: Use getAllBy* and take [0] to get the first (visible) instance.
     * This only affects custom headerTitle components, not other screen elements.
     */
    const screenTitle = screen.getAllByText(/Connect device/i)[0];
    const stepIndicator = screen.getAllByText(/Step 2 of 3/i)[0];
    const listHeader = screen.getByText(/Devices/i);

    const addDeviceCTA = screen.getByText(/Add a Ledger/i);
    const bottomText = screen.getByText(/Need a new Ledger?/i);
    const buyNowCTA = screen.getByText(/Buy now?/i);

    [listHeader, screenTitle, stepIndicator, addDeviceCTA, bottomText, buyNowCTA].forEach(
      element => {
        expect(element).toBeOnTheScreen();
      },
    );
  });

  it("should render a device selection screen when a device is installed", () => {
    mockDiscoverDevices.mockReturnValue(
      of({
        type: "add",
        id: "usb|1",
        name: "Ledger Stax device",
        deviceModel: { id: DeviceModelId.stax },
        wired: true,
      }),
    );
    render(<DeviceSelectionNavigator />);
    const deviceCTA = screen.getByTestId("device-item-usb|1");
    const notConnectedText = screen.getByText(/connected/i);
    const addNewCTA = screen.queryByText(/Add new/i);
    const bottomText = screen.getByText(/Need a new Ledger?/i);
    const buyNowCTA = screen.getByText(/Buy now?/i);

    [deviceCTA, notConnectedText, bottomText, buyNowCTA, addNewCTA].forEach(element => {
      expect(element).toBeOnTheScreen();
    });
  });
});
