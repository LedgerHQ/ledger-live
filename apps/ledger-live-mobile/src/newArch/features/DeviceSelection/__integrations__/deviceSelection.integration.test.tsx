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

    const screenTitle = screen.getByText(/Connect device/i);
    const listHeader = screen.getByText(/Devices/i);
    const stepIndicator = screen.getByText(/Step 2 of 3/i);
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
