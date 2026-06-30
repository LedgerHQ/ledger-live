import * as React from "react";
import { render, screen, withReadOnlyDisabled, renderHook } from "@tests/test-renderer";
import DeviceSelectionNavigator from "../Navigator";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useNavigation as useNavigationCore } from "@react-navigation/core";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { of } from "rxjs";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import useSelectDeviceViewModel from "../screens/SelectDevice/useSelectDeviceViewModel";
import { getCustomAddAccountFlow } from "LLM/features/Accounts/customAddAccountFlow";
import { NavigatorName, ScreenName } from "~/const";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";

const MockUseRoute = useRoute as jest.Mock;
const mockNavigate = jest.fn();
const mockDiscoverDevices = discoverDevices as jest.Mock;

(useNavigation as jest.Mock).mockReturnValue({
  navigate: mockNavigate,
  addListener: jest.fn(),
});

(useNavigationCore as jest.Mock).mockReturnValue({
  navigate: mockNavigate,
  addListener: jest.fn(),
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hw/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/index"),
  discoverDevices: jest.fn(),
}));

jest.mock("LLM/features/Accounts/customAddAccountFlow", () => ({
  getCustomAddAccountFlow: jest.fn(),
}));

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("~/bridge/cache", () => ({
  prepareCurrency: jest.fn(),
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
    render(<DeviceSelectionNavigator />, {
      overrideInitialState: withReadOnlyDisabled,
    });

    const screenTitle = screen.getByText(/Connect device/i);
    const stepIndicator = screen.getByText(/Step 2 of 3/i);
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
    render(<DeviceSelectionNavigator />, {
      overrideInitialState: withReadOnlyDisabled,
    });
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

describe("useSelectDeviceViewModel — onResult navigation", () => {
  const mockGetCustomAddAccountFlow = getCustomAddAccountFlow as jest.Mock;
  const mockOnDeviceConnected = jest.fn();

  const aleoCurrency = {
    type: "CryptoCurrency" as const,
    id: "aleo",
    ticker: "ALEO",
    name: "Aleo",
    family: "aleo",
    color: "#000000",
    decimals: 6,
    managerAppName: "Aleo",
  };

  const bitcoinCurrency = {
    type: "CryptoCurrency" as const,
    id: "bitcoin",
    ticker: "BTC",
    name: "Bitcoin",
    family: "bitcoin",
    color: "#ffae35",
    decimals: 8,
    managerAppName: "Bitcoin",
  };

  const mockMeta = {} as AppResult;

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      addListener: jest.fn(),
    });
    (useNavigationCore as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      addListener: jest.fn(),
    });
  });

  it("invokes onDeviceConnected and does not navigate to ScanDeviceAccounts when a custom flow is registered", () => {
    mockGetCustomAddAccountFlow.mockReturnValue({ onDeviceConnected: mockOnDeviceConnected });

    const route = {
      params: { context: AddAccountContexts.AddAccounts, currency: aleoCurrency },
    } as Parameters<typeof useSelectDeviceViewModel>[0];

    const { result } = renderHook(() => useSelectDeviceViewModel(route), {
      overrideInitialState: withReadOnlyDisabled,
    });

    result.current.onResult(mockMeta);

    expect(mockOnDeviceConnected).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalledWith(
      NavigatorName.AddAccounts,
      expect.objectContaining({ screen: ScreenName.ScanDeviceAccounts }),
    );
  });

  it("navigates to ScanDeviceAccounts when no custom flow is registered for the currency", () => {
    mockGetCustomAddAccountFlow.mockReturnValue(null);

    const route = {
      params: { context: AddAccountContexts.AddAccounts, currency: bitcoinCurrency },
    } as Parameters<typeof useSelectDeviceViewModel>[0];

    const { result } = renderHook(() => useSelectDeviceViewModel(route), {
      overrideInitialState: withReadOnlyDisabled,
    });

    result.current.onResult(mockMeta);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AddAccounts, {
      screen: ScreenName.ScanDeviceAccounts,
      params: expect.objectContaining({ sourceScreenName: ScreenName.SelectDevice }),
    });
    expect(mockOnDeviceConnected).not.toHaveBeenCalled();
  });

  it("navigates to ScanDeviceAccounts when a custom flow exists but has no onDeviceConnected handler", () => {
    mockGetCustomAddAccountFlow.mockReturnValue({});

    const route = {
      params: { context: AddAccountContexts.AddAccounts, currency: bitcoinCurrency },
    } as Parameters<typeof useSelectDeviceViewModel>[0];

    const { result } = renderHook(() => useSelectDeviceViewModel(route), {
      overrideInitialState: withReadOnlyDisabled,
    });

    result.current.onResult(mockMeta);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AddAccounts, {
      screen: ScreenName.ScanDeviceAccounts,
      params: expect.objectContaining({ sourceScreenName: ScreenName.SelectDevice }),
    });
  });
});
