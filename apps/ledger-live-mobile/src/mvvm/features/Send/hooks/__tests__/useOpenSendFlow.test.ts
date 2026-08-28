import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
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

  it("forwards a recipient override to the new send flow", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("send-account-selection-with-recipient", { currency });
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const { result } = renderHook(
      () =>
        useOpenSendFlow({
          currency,
          recipient,
          sourceScreenName: "Contact Detail",
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
    act(() => onAccountSelected(account));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFlow, {
      params: {
        account,
        parentAccount: undefined,
        fromMAD: true,
        recipient,
      },
    });
  });

  it("forwards the direct recipient intent to the new send flow", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("direct-new-send-account-selection", { currency });
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const { result } = renderHook(
      () =>
        useOpenSendFlow({
          currency,
          sourceScreenName: "Contact Detail",
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

    act(() => result.current.handleOpenSendFlow({ recipient, skipRecipientStep: true }));
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    act(() => onAccountSelected(account));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFlow, {
      params: {
        account,
        parentAccount: undefined,
        fromMAD: true,
        recipient,
        skipRecipientStep: true,
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
        account,
      },
    });
  });

  it("prefills the legacy recipient when a recipient override is provided", async () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("legacy-send-with-recipient", { currency });
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        recipient,
        sourceScreenName: "Contact Detail",
      }),
    );

    act(() => result.current.handleOpenSendFlow());
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    await act(async () => {
      onAccountSelected(account);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
        screen: ScreenName.SendSelectRecipient,
        params: expect.objectContaining({
          accountId: account.id,
          parentId: undefined,
          transaction: expect.objectContaining({ recipient }),
        }),
      });
    });
  });

  it("opens the legacy amount step for a direct recipient", async () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("legacy-send-contact", { currency });
    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        sourceScreenName: "Contact Detail",
      }),
    );

    act(() => result.current.handleOpenSendFlow({ recipient, skipRecipientStep: true }));
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    await act(async () => {
      onAccountSelected(account);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
        screen: ScreenName.SendAmountCoin,
        params: expect.objectContaining({
          accountId: account.id,
          transaction: expect.objectContaining({ recipient }),
        }),
      });
    });
  });

  it("keeps the legacy recipient step for a direct recipient on a currency with a memo", async () => {
    const currency = getCryptoCurrencyById("stellar");
    const account = genAccount("legacy-send-contact-with-memo", { currency });
    const recipient = "GABCD1234EFGH5678IJKL9012MNOP3456QRST7890UVWXYZ";
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        sourceScreenName: "Contact Detail",
      }),
    );

    act(() => result.current.handleOpenSendFlow({ recipient, skipRecipientStep: true }));
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    await act(async () => {
      onAccountSelected(account);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
        screen: ScreenName.SendSelectRecipient,
        params: expect.objectContaining({
          accountId: account.id,
          transaction: expect.objectContaining({ recipient }),
        }),
      });
    });
  });

  it("keeps recipient selection for an empty direct legacy recipient", async () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("legacy-send-empty-contact", { currency });
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        sourceScreenName: "Contact Detail",
      }),
    );

    act(() => result.current.handleOpenSendFlow({ recipient: "   ", skipRecipientStep: true }));
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    await act(async () => {
      onAccountSelected(account);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
        screen: ScreenName.SendSelectRecipient,
        params: expect.objectContaining({
          accountId: account.id,
          transaction: expect.objectContaining({ recipient: "   " }),
        }),
      });
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
        account: tokenAccount,
      },
    });
  });

  it("passes the direct recipient intent to a custom family entrypoint", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const account = genAccount("custom-send-account-selection", { currency });
    const customEntrypoint = {
      screen: ScreenName.SendCoin,
      params: { selectedCurrency: currency },
    };
    const buildSendEntrypoint = jest.fn(() => customEntrypoint);
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      buildSendEntrypoint,
    });
    const { result } = renderHook(() =>
      useOpenSendFlow({
        currency,
        sourceScreenName: "Asset Detail",
      }),
    );

    const recipient = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
    act(() => result.current.handleOpenSendFlow({ recipient, skipRecipientStep: true }));
    const onAccountSelected = mockOpenDrawer.mock.calls[0][0].onAccountSelected;
    act(() => onAccountSelected(account));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, customEntrypoint);
    expect(buildSendEntrypoint).toHaveBeenCalledWith({
      account,
      parentAccount: undefined,
      recipient,
      skipRecipientStep: true,
    });
  });
});
