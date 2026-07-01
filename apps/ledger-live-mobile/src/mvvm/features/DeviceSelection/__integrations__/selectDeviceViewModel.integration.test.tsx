import { renderHook, withReadOnlyDisabled } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { useNavigation as useNavigationCore } from "@react-navigation/core";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import useSelectDeviceViewModel from "../screens/SelectDevice/useSelectDeviceViewModel";
import { getCustomAddAccountFlow } from "LLM/features/Accounts/utils/customAddAccountFlow";
import { NavigatorName, ScreenName } from "~/const";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const mockNavigate = jest.fn();

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
  useNavigation: jest.fn(),
}));

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: jest.fn(),
}));

jest.mock("LLM/features/Accounts/utils/customAddAccountFlow", () => ({
  getCustomAddAccountFlow: jest.fn(),
}));

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("~/bridge/cache", () => ({
  prepareCurrency: jest.fn(),
}));

describe("useSelectDeviceViewModel — onResult navigation", () => {
  const mockGetCustomAddAccountFlow = getCustomAddAccountFlow as jest.Mock;
  const mockOnDeviceConnected = jest.fn();

  const aleoCurrency: CryptoCurrency = {
    type: "CryptoCurrency",
    coinType: 683,
    scheme: "aleo",
    id: "aleo",
    ticker: "ALEO",
    name: "Aleo",
    family: "aleo",
    color: "#000000",
    managerAppName: "Aleo",
    units: [],
    explorerViews: [],
  };

  const bitcoinCurrency: CryptoCurrency = {
    type: "CryptoCurrency",
    coinType: 0,
    scheme: "bitcoin",
    id: "bitcoin",
    ticker: "BTC",
    name: "Bitcoin",
    family: "bitcoin",
    color: "#ffae35",
    managerAppName: "Bitcoin",
    units: [],
    explorerViews: [],
  };

  const mockMeta = {} as AppResult;

  const getRouteMock = (currency: CryptoCurrency) => {
    return {
      params: { context: AddAccountContexts.AddAccounts, currency },
    } as unknown as Parameters<typeof useSelectDeviceViewModel>[0];
  };

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

    const route = getRouteMock(aleoCurrency);

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

    const route = getRouteMock(bitcoinCurrency);

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

    const route = getRouteMock(bitcoinCurrency);

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
