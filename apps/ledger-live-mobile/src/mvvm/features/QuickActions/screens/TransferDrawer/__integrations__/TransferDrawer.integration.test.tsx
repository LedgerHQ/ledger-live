import { track } from "@shared/analytics";
import React from "react";
import { act, render, renderHook, screen, within, withFlagOverrides } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import { TransferDrawer } from "..";
import { QUICK_ACTIONS_TEST_IDS } from "../../../testIds";
import { NavigatorName, ScreenName } from "~/const";
import {
  createMockAccount,
  overrideStateWithFunds,
} from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";
import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { TransferDrawerScope } from "~/reducers/transferDrawer";
import type { useOpenReceiveDrawer } from "LLM/features/Receive";
import type { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";

const mockNavigate = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockOpenReceiveForAccount = jest.fn();
const mockUseOpenReceiveDrawer = jest.fn((..._args: Parameters<typeof useOpenReceiveDrawer>) => ({
  handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer,
  openReceiveForAccount: mockOpenReceiveForAccount,
}));
const mockHandleOpenSendFlow = jest.fn();
const mockOpenSendFlowForAccount = jest.fn();
const mockUseOpenSendFlow = jest.fn((..._args: Parameters<typeof useOpenSendFlow>) => ({
  handleOpenSendFlow: mockHandleOpenSendFlow,
  openSendFlowForAccount: mockOpenSendFlowForAccount,
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

jest.mock("LLM/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: (...args: Parameters<typeof useOpenSendFlow>) => mockUseOpenSendFlow(...args),
}));

jest.mock("LLM/features/Noah/useNoahEntryPoint", () => ({
  useReceiveNoahEntry: () => ({ showNoahMenu: true }),
}));

const SOURCE_SCREEN = "Portfolio";

const overrideWithOpenDrawer =
  (scope: TransferDrawerScope = { type: "wallet" }) =>
  (state: State): State => {
    const base = overrideStateWithFunds(state);
    return {
      ...base,
      transferDrawer: {
        isOpen: true,
        sourceScreenName: SOURCE_SCREEN,
        scope,
      },
    };
  };

const assetScope = (
  currency: CryptoOrTokenCurrency,
  ledgerIds?: string[],
): TransferDrawerScope => ({ type: "asset", currency, ledgerIds });

const findAction = (
  result: { current: ReturnType<typeof useTransferDrawerViewModel> },
  id: string,
) => result.current.actions.find(a => a.id === id)!;

describe("TransferDrawer Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (scope?: TransferDrawerScope) =>
    renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: overrideWithOpenDrawer(scope),
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
      blockchain: "",
      currency: "",
      currency_id: "",
      flow: "send",
      newSendFlow: false,
    });
  });

  it("send keeps the legacy account selection when the new send flow is disabled", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const ledgerIds = ["ethereum", "arbitrum", "base"];

    const { result } = renderViewModel(assetScope(currency, ledgerIds));

    findAction(result, "send").onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
      params: { selectedCurrency: currency, currencyIds: ledgerIds },
    });
    expect(mockHandleOpenSendFlow).not.toHaveBeenCalled();
  });

  it("send opens account selection filtered to the asset when the new send flow is enabled", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const ledgerIds = ["ethereum", "arbitrum", "base"];
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        },
        overrideWithOpenDrawer(assetScope(currency, ledgerIds)),
      ),
    });

    findAction(result, "send").onPress();

    expect(mockUseOpenSendFlow).toHaveBeenCalledWith({
      currency,
      currencyIds: ledgerIds,
      sourceScreenName: SOURCE_SCREEN,
    });
    expect(mockHandleOpenSendFlow).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("tracks newSendFlow as true when the asset family is allowed by the flag", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        },
        overrideWithOpenDrawer(assetScope(currency)),
      ),
    });

    findAction(result, "send").onPress();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "send", newSendFlow: true }),
    );
  });

  it("tracks newSendFlow as false when the asset family is not allowed by the flag", () => {
    const currency = getCryptoCurrencyById("solana");
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          newSendFlow: {
            enabled: true,
            params: {
              families: ["evm", "bitcoin", "tron"],
              excludedCurrencyIds: [],
            },
          },
        },
        overrideWithOpenDrawer(assetScope(currency)),
      ),
    });

    findAction(result, "send").onPress();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "send", newSendFlow: false }),
    );
    expect(mockHandleOpenSendFlow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
      params: { selectedCurrency: currency, currencyIds: undefined },
    });
  });

  it("tracks newSendFlow as false when the asset currency is excluded by the flag", () => {
    const currency = getCryptoCurrencyById("dash");
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          newSendFlow: {
            enabled: true,
            params: { families: ["bitcoin"], excludedCurrencyIds: ["dash"] },
          },
        },
        overrideWithOpenDrawer(assetScope(currency)),
      ),
    });

    findAction(result, "send").onPress();

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "send", newSendFlow: false }),
    );
    expect(mockHandleOpenSendFlow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
      params: { selectedCurrency: currency, currencyIds: undefined },
    });
  });

  it("opens unfiltered account selection when the new send flow is enabled without a currency", () => {
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        },
        overrideWithOpenDrawer(),
      ),
    });

    findAction(result, "send").onPress();

    expect(mockHandleOpenSendFlow).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "send", newSendFlow: true }),
    );
  });

  it("keeps legacy account selection when the new send flow config has no families", () => {
    const { result } = renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          newSendFlow: {
            enabled: true,
            params: { families: [], excludedCurrencyIds: [] },
          },
        },
        overrideWithOpenDrawer(),
      ),
    });

    findAction(result, "send").onPress();

    expect(mockHandleOpenSendFlow).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
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

    renderViewModel(assetScope(getCryptoCurrencyById("ethereum"), ledgerIds));

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

const withSpendable = <T extends Account | TokenAccount>(account: T, spendable: number): T => ({
  ...account,
  spendableBalance: new BigNumber(spendable),
});

describe("TransferDrawer account scope", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ethAccount: Account = {
    ...createMockAccount(getCryptoCurrencyById("ethereum"), "account-scope-eth"),
    subAccounts: [],
  };
  const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
  const withUsdc = (ethSpendable: number, usdcSpendable: number): Account => ({
    ...withSpendable(ethAccount, ethSpendable),
    subAccounts: [withSpendable(usdcAccount, usdcSpendable)],
  });

  const renderForAccount = (account: Account) =>
    renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: (state: State): State => {
        const base = overrideWithOpenDrawer({ type: "account", accountId: account.id })(state);
        return { ...base, accounts: { ...base.accounts, active: [account] } };
      },
    });

  it("opens receive directly on the account", () => {
    const { result } = renderForAccount(ethAccount);

    findAction(result, "receive").onPress();

    expect(mockOpenReceiveForAccount).toHaveBeenCalledWith(ethAccount);
    expect(mockHandleOpenReceiveDrawer).not.toHaveBeenCalled();
  });

  it("starts the send flow from the account when only its coin can be sent", () => {
    const account = withSpendable(ethAccount, 1);
    const { result } = renderForAccount(account);

    findAction(result, "send").onPress();

    expect(mockOpenSendFlowForAccount).toHaveBeenCalledWith(account, undefined);
    expect(result.current.assetPicker.isOpen).toBe(false);
    expect(mockHandleOpenSendFlow).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("lists the account's assets without balance in the send picker too", () => {
    const { result } = renderForAccount(withUsdc(0, 5));

    act(() => findAction(result, "send").onPress());

    expect(result.current.assetPicker.isOpen).toBe(true);
    expect(result.current.assetPicker.assets.map(({ currency }) => currency.id)).toEqual([
      ethAccount.currency.id,
      usdcToken.id,
    ]);
    expect(mockOpenSendFlowForAccount).not.toHaveBeenCalled();
  });

  it("asks which asset to send when several assets of the account can be sent", () => {
    const account = withUsdc(1, 5);
    const { result } = renderForAccount(account);

    act(() => findAction(result, "send").onPress());

    expect(result.current.assetPicker.isOpen).toBe(true);
    expect(result.current.assetPicker.assets.map(({ currency }) => currency.id)).toEqual([
      account.currency.id,
      usdcToken.id,
    ]);
    expect(mockOpenSendFlowForAccount).not.toHaveBeenCalled();

    const [, usdcAsset] = result.current.assetPicker.assets;
    act(() => result.current.assetPicker.onSelect(usdcAsset));

    expect(result.current.assetPicker.isOpen).toBe(false);
    expect(mockOpenSendFlowForAccount).toHaveBeenCalledWith(
      expect.objectContaining({ id: usdcAccount.id }),
      expect.objectContaining({ id: account.id }),
    );
  });

  it("enables send when only a token has a spendable balance", () => {
    const { result } = renderForAccount(withUsdc(0, 5));

    expect(findAction(result, "send").disabled).toBe(false);
  });

  it("disables send when no asset of the account has a spendable balance, even if the wallet has funds", () => {
    const { result } = renderForAccount(withUsdc(0, 0));

    expect(findAction(result, "send").disabled).toBe(true);
  });

  it("enables send when the account coin has a spendable balance", () => {
    const { result } = renderForAccount(withSpendable(ethAccount, 1));

    expect(findAction(result, "send").disabled).toBe(false);
  });

  it("uses the account currency for the receive and Noah checks", () => {
    renderForAccount(ethAccount);

    expect(mockUseOpenReceiveDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ currency: ethAccount.currency, currencyIds: undefined }),
    );
  });

  it("closes the asset picker without starting a send when dismissed", () => {
    const { result } = renderForAccount(withUsdc(1, 5));

    act(() => findAction(result, "send").onPress());
    act(() => result.current.assetPicker.onClose());

    expect(result.current.assetPicker.isOpen).toBe(false);
    expect(mockOpenSendFlowForAccount).not.toHaveBeenCalled();
  });

  describe("family without send and receive", () => {
    const hypercoreAccount = (): Account => {
      const account = withUsdc(1, 5);
      return { ...account, currency: { ...account.currency, family: "hypercore" } };
    };

    it("disables send even when the account has spendable assets", () => {
      const { result } = renderForAccount(hypercoreAccount());

      expect(findAction(result, "send").disabled).toBe(true);
    });

    it("disables receive and never opens it on the account", () => {
      const { result } = renderForAccount(hypercoreAccount());

      expect(findAction(result, "receive").disabled).toBe(true);
      findAction(result, "receive").onPress();
      expect(mockOpenReceiveForAccount).not.toHaveBeenCalled();
    });
  });

  describe("rendered asset picker", () => {
    const pickerList = `${QUICK_ACTIONS_TEST_IDS.transferDrawer.assetPicker}-list`;

    const renderDrawer = (account: Account) =>
      render(<TransferDrawer />, {
        overrideInitialState: (state: State): State => {
          const base = overrideWithOpenDrawer({ type: "account", accountId: account.id })(state);
          return { ...base, accounts: { ...base.accounts, active: [account] } };
        },
      });

    it("sends the token picked in the sheet from its account", async () => {
      const account = withUsdc(1, 5);
      const { user } = renderDrawer(account);

      await user.press(await screen.findByTestId(QUICK_ACTIONS_TEST_IDS.transferDrawer.send));
      const picker = await screen.findByTestId(pickerList);
      expect(within(picker).getByText(account.currency.name)).toBeVisible();

      await user.press(within(picker).getByText(usdcToken.name));

      expect(mockOpenSendFlowForAccount).toHaveBeenCalledWith(
        expect.objectContaining({ id: usdcAccount.id }),
        expect.objectContaining({ id: account.id }),
      );
    });

    it("doesn't render the picker when the account has a single asset", async () => {
      const { user } = renderDrawer(withSpendable(ethAccount, 1));

      await user.press(await screen.findByTestId(QUICK_ACTIONS_TEST_IDS.transferDrawer.send));

      expect(screen.queryByTestId(pickerList)).toBeNull();
      expect(mockOpenSendFlowForAccount).toHaveBeenCalledTimes(1);
    });
  });
});
