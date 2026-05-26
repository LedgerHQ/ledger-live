import { renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { overrideStateWithFunds } from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";
import type { Account } from "@ledgerhq/types-live";

const mockNavigate = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockUseOpenReceiveDrawer = jest.fn((_props: unknown) => ({
  handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: (props: unknown) => mockUseOpenReceiveDrawer(props),
}));

jest.mock("LLM/features/Noah/useNoahEntryPoint", () => ({
  useReceiveNoahEntry: () => ({ showNoahMenu: true }),
}));

const SOURCE_SCREEN = "Portfolio";
const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const assetScopedCurrencyIds = [bitcoinCurrency.id];

const overrideWithOpenDrawer = (state: State): State => {
  const base = overrideStateWithFunds(state);
  return {
    ...base,
    transferDrawer: {
      isOpen: true,
      sourceScreenName: SOURCE_SCREEN,
    },
  };
};

const findAction = (
  result: { current: ReturnType<typeof useTransferDrawerViewModel> },
  id: string,
) => result.current.actions.find(a => a.id === id)!;

describe("TransferDrawer Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (params?: Parameters<typeof useTransferDrawerViewModel>[0]) =>
    renderHook(() => useTransferDrawerViewModel(params), {
      overrideInitialState: overrideWithOpenDrawer,
    });

  it("send navigates to SendFunds/SendCoin and tracks", () => {
    const { result } = renderViewModel();

    findAction(result, "send").onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "send",
      buttonLocation: "quick_action_transfer",
      page: SOURCE_SCREEN,
    });
  });

  it("bank_transfer navigates to ReceiveFunds/ReceiveProvider with noah manifest and tracks", () => {
    const { result } = renderViewModel();

    findAction(result, "bank_transfer").onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: { manifestId: "noah" },
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "bank_transfer",
      buttonLocation: "quick_action_transfer",
      page: SOURCE_SCREEN,
    });
  });

  it("receive opens receive drawer and tracks", () => {
    const { result } = renderViewModel();

    findAction(result, "receive").onPress();

    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "receive",
      buttonLocation: "quick_action_transfer",
      page: SOURCE_SCREEN,
    });
  });

  it("configures receive without a preselected currency when opened outside Asset Detail", () => {
    renderViewModel();

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      currency: undefined,
      currencyIds: undefined,
      sourceScreenName: SOURCE_SCREEN,
      fromMenu: true,
    });
  });

  it("configures receive with the Asset Detail currency when provided", () => {
    const { result } = renderViewModel({ currency: bitcoinCurrency });

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      currency: bitcoinCurrency,
      currencyIds: undefined,
      sourceScreenName: SOURCE_SCREEN,
      fromMenu: true,
    });

    findAction(result, "receive").onPress();

    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
  });

  it("configures receive with asset-scoped currency ids when provided", () => {
    renderViewModel({ currency: bitcoinCurrency, currencyIds: assetScopedCurrencyIds });

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith({
      currency: bitcoinCurrency,
      currencyIds: assetScopedCurrencyIds,
      sourceScreenName: SOURCE_SCREEN,
      fromMenu: true,
    });
  });
});
