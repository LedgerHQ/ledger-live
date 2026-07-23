import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenAccount } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { useOpenSendFlow } from "../useOpenSendFlow";

const mockNavigate = jest.fn();
const mockOpenDrawer = jest.fn();
const mockGetCustomSendFlow = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

jest.mock("~/screens/SendFunds/utils/customSendFlow", () => ({
  getCustomSendFlow: (...args: unknown[]) => mockGetCustomSendFlow(...args),
}));

describe("useOpenSendFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCustomSendFlow.mockReturnValue(null);
  });

  it("opens account selection filtered to the asset before navigating to the new send flow", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const ledgerIds = ["ethereum", "arbitrum", "base"];
    const account = genAccount("send-account-selection", { currency });
    const { result } = renderHook(
      () =>
        useOpenSendFlow({
          currency,
          currencyIds: ledgerIds,
          sourceScreenName: "Asset Detail",
        }),
      {
        overrideInitialState: withFlagOverrides({
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        }),
      },
    );

    act(() => result.current.handleOpenSendFlow());

    expect(mockOpenDrawer).toHaveBeenCalledWith({
      currencies: ledgerIds,
      flow: "send",
      source: "Asset Detail",
      areCurrenciesFiltered: true,
      enableAccountSelection: true,
      onAccountSelected: expect.any(Function),
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    act(() => onAccountSelected(account));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFlow, {
      params: {
        account,
        parentAccount: undefined,
        fromMAD: true,
      },
    });
  });

  it("falls back to the legacy recipient screen when the selected account is not eligible", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("legacy-send-account-selection", { currency });
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        sourceScreenName: "Asset Detail",
      }),
    );

    act(() => result.current.handleOpenSendFlow());
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    act(() => onAccountSelected(account));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: account.id,
        parentId: undefined,
      },
    });
  });

  it("falls back safely when a token account is selected without its parent account", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const parentId = "missing-parent";
    const tokenAccount = {
      ...genAccount("token-send-account-selection", { currency }),
      type: "TokenAccount",
      parentId,
      token: { id: "ethereum/erc20/test" },
    } as unknown as TokenAccount;
    const { result } = renderHook(
      () =>
        useOpenSendFlow({
          currency,
          sourceScreenName: "Asset Detail",
        }),
      {
        overrideInitialState: withFlagOverrides({
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        }),
      },
    );

    act(() => result.current.handleOpenSendFlow());
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    act(() => onAccountSelected(tokenAccount));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: tokenAccount.id,
        parentId,
      },
    });
  });

  it("uses a custom family entrypoint when the selected account provides one", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("custom-send-account-selection", { currency });
    const customEntrypoint = {
      screen: ScreenName.SendCoin,
      params: { selectedCurrency: currency },
    };
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      buildSendEntrypoint: () => customEntrypoint,
    });
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        sourceScreenName: "Asset Detail",
      }),
    );

    act(() => result.current.handleOpenSendFlow());
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    act(() => onAccountSelected(account));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, customEntrypoint);
  });
});
