import { renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { overrideStateWithFunds } from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";
import type { Account } from "@ledgerhq/types-live";
import type { useOpenReceiveDrawer } from "LLM/features/Receive";

const mockNavigate = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockUseOpenReceiveDrawer = jest.fn((..._args: Parameters<typeof useOpenReceiveDrawer>) => ({
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
  useOpenReceiveDrawer: (...args: Parameters<typeof useOpenReceiveDrawer>) =>
    mockUseOpenReceiveDrawer(...args),
}));

jest.mock("LLM/features/Noah/useNoahEntryPoint", () => ({
  useReceiveNoahEntry: () => ({ showNoahMenu: true }),
}));

const SOURCE_SCREEN = "Portfolio";

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

describe("TransferDrawer Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (params?: Parameters<typeof useTransferDrawerViewModel>[0]) =>
    renderHook(() => useTransferDrawerViewModel(params), {
      overrideInitialState: overrideWithOpenDrawer,
    });

  const findAction = (
    result: { current: ReturnType<typeof useTransferDrawerViewModel> },
    id: string,
  ) => result.current.actions.find(a => a.id === id)!;

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
      blockchain: "",
      currency: "",
      currency_id: "",
      flow: "send",
      newSendFlow: false,
    });
  });

  it("send forwards selectedCurrency and currencyIds when opened from an asset", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const ledgerIds = ["ethereum", "arbitrum", "base"];

    const { result } = renderViewModel({ currency, ledgerIds });

    findAction(result, "send").onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
      params: { selectedCurrency: currency, currencyIds: ledgerIds },
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

  it("forwards ledgerIds to useOpenReceiveDrawer for multi-network pre-selection", () => {
    const ledgerIds = ["ethereum/erc20/usd_coin", "polygon/erc20/usd_coin", "base/erc20/usd_coin"];

    renderViewModel({ ledgerIds });

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ currencyIds: ledgerIds }),
    );
  });

  it("does not pass currencyIds when ledgerIds is omitted", () => {
    renderViewModel();

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ currencyIds: undefined }),
    );
  });
});
