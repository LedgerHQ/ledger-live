import React, { useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";
import {
  useAccountHeroPort,
  type AccountHeroPortResult,
} from "../screens/AccountDetail/components/Hero/useAccountHeroPort";

type Availability = { buy: Set<string>; sell: Set<string>; swap: Set<string>; stake: Set<string> };

const ETH = "ethereum";
const mockAvailability: { current: Availability } = {
  current: { buy: new Set(), sell: new Set(), swap: new Set(), stake: new Set() },
};
const mockDeactivated = { current: new Set<string>() };
const mockOpenBuySellForAccount = jest.fn();
const mockOpenBuySellForCurrency = jest.fn();
const mockOpenSwapForAccount = jest.fn();
const mockOpenDrawer = jest.fn();

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({
    getSupportedCryptoCurrencyIds: (mode: "onRamp" | "offRamp") => [
      ...(mode === "onRamp" ? mockAvailability.current.buy : mockAvailability.current.sell),
    ],
  }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: [...mockAvailability.current.swap] }),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => ({ deactivatedCurrencyIds: mockDeactivated.current }),
}));

jest.mock("LLM/hooks/useStake/useStake", () => ({
  ...jest.requireActual("LLM/hooks/useStake/useStake"),
  useStake: () => ({
    ...jest.requireActual("LLM/hooks/useStake/useStake").useStake(),
    getCanStakeCurrency: (id: string) => mockAvailability.current.stake.has(id),
  }),
}));

jest.mock("LLM/features/Buy", () => ({
  ...jest.requireActual("LLM/features/Buy"),
  useOpenBuySell: () => ({
    handleOpenBuySell: jest.fn(),
    openBuySellForAccount: mockOpenBuySellForAccount,
    openBuySellForCurrency: mockOpenBuySellForCurrency,
  }),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  ...jest.requireActual("LLM/features/ModularDrawer"),
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

jest.mock("LLM/features/Swap", () => ({
  ...jest.requireActual("LLM/features/Swap"),
  useOpenSwap: () => ({
    handleOpenSwap: jest.fn(),
    openSwapForAccount: mockOpenSwapForAccount,
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

function setAvailability(overrides: Partial<Record<keyof Availability, string[]>> = {}) {
  const all = [ETH, usdcToken.id];
  mockAvailability.current = {
    buy: new Set(overrides.buy ?? all),
    sell: new Set(overrides.sell ?? all),
    swap: new Set(overrides.swap ?? all),
    stake: new Set(overrides.stake ?? [ETH]),
  };
}

const ethRoot = genAccount("account-detail-hero-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});
const withBalance = (account: Account, balance: string): Account => ({
  ...account,
  balance: new BigNumber(balance),
  spendableBalance: new BigNumber(balance),
});
const fundedAccount = withBalance(ethRoot, "1000000000000000000");
const emptyAccount = withBalance(ethRoot, "0");
const usdcAccount = {
  ...genTokenAccount(0, ethRoot, usdcToken),
  balance: new BigNumber(5000000),
  spendableBalance: new BigNumber(5000000),
};
const accountWithToken: Account = { ...fundedAccount, subAccounts: [usdcAccount] };

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccount(account: Account) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
      },
    },
  );
}

const tile = (id: string) => `${ACCOUNT_DETAIL_TEST_IDS.hero}-actions-${id}`;
const moreItem = (id: string) => `${ACCOUNT_DETAIL_TEST_IDS.hero}-more-sheet-${id}`;

describe("AccountDetail hero", () => {
  beforeEach(() => {
    mockOpenBuySellForAccount.mockClear();
    mockDeactivated.current = new Set();
    setAvailability();
  });

  it("shows Transfer · Swap · More for a funded account", async () => {
    renderAccount(fundedAccount);

    expect(await screen.findByTestId(tile("transfer"))).toBeVisible();
    expect(screen.getByTestId(tile("swap"))).toBeVisible();
    expect(screen.getByTestId(tile("more"))).toBeVisible();
  });

  it("opens Buy, Sell and Earn from More", async () => {
    const { user } = renderAccount(fundedAccount);

    await user.press(await screen.findByTestId(tile("more")));

    expect(screen.getByTestId(moreItem("buy"))).toBeVisible();
    expect(screen.getByTestId(moreItem("sell"))).toBeVisible();
    expect(screen.getByTestId(moreItem("earn"))).toBeVisible();
  });

  it("shows only Transfer and Buy when no asset has a spendable balance", async () => {
    renderAccount(emptyAccount);

    expect(await screen.findByTestId(tile("transfer"))).toBeVisible();
    expect(screen.getByTestId(tile("buy"))).toBeVisible();
    expect(screen.queryByTestId(tile("swap"))).toBeNull();
    expect(screen.queryByTestId(tile("more"))).toBeNull();
  });

  it("opens the Transfer sheet on the account scope from the Transfer tile", async () => {
    const { user, store } = renderAccount(fundedAccount);

    await user.press(await screen.findByTestId(tile("transfer")));

    expect(store.getState().transferDrawer).toEqual(
      expect.objectContaining({
        isOpen: true,
        scope: { type: "account", accountId: fundedAccount.id },
      }),
    );
  });

  it("opens Sell on the only sellable asset from More", async () => {
    setAvailability({ sell: [usdcToken.id] });
    const { user } = renderAccount(accountWithToken);

    await user.press(await screen.findByTestId(tile("more")));
    await user.press(screen.getByTestId(moreItem("sell")));

    expect(mockOpenBuySellForAccount).toHaveBeenCalledWith(
      "sell",
      expect.objectContaining({ id: usdcAccount.id }),
      expect.objectContaining({ id: accountWithToken.id }),
    );
  });

  it("promotes Buy and Sell to tiles when no asset can be swapped", async () => {
    setAvailability({ swap: [], stake: [] });
    renderAccount(fundedAccount);

    expect(await screen.findByTestId(tile("buy"))).toBeVisible();
    expect(screen.getByTestId(tile("sell"))).toBeVisible();
    expect(screen.queryByTestId(tile("swap"))).toBeNull();
    expect(screen.queryByTestId(tile("more"))).toBeNull();
  });

  it("keeps only Transfer when the currency is deactivated", async () => {
    mockDeactivated.current = new Set([ETH]);
    renderAccount(fundedAccount);

    expect(await screen.findByTestId(tile("transfer"))).toBeVisible();
    expect(screen.queryByTestId(tile("swap"))).toBeNull();
    expect(screen.queryByTestId(tile("more"))).toBeNull();
  });

  it("shows Swap when only a token of the account can be swapped", async () => {
    setAvailability({ swap: [usdcToken.id] });
    renderAccount(accountWithToken);

    expect(await screen.findByTestId(tile("swap"))).toBeVisible();
  });
});

function renderPort(account: Account) {
  const result: { current: AccountHeroPortResult } = { current: undefined! };
  function PortProbe() {
    const port = useAccountHeroPort(account);
    useEffect(() => {
      result.current = port;
    });
    return null;
  }
  const { store } = render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.Account} component={PortProbe} />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        return { ...state, accounts: { ...state.accounts, active: [account] } };
      },
    },
  );
  return { result, store };
}

const pickInDrawer = (currency: CryptoOrTokenCurrency) =>
  act(() => mockOpenDrawer.mock.calls[0][0].onCurrencySelected(currency));

describe("useAccountHeroPort actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeactivated.current = new Set();
    setAvailability();
  });

  it("opens the Transfer sheet on the account scope", () => {
    const { result, store } = renderPort(fundedAccount);

    act(() => result.current.port.onAction("transfer"));

    expect(store.getState().transferDrawer).toEqual(
      expect.objectContaining({
        isOpen: true,
        scope: { type: "account", accountId: fundedAccount.id },
      }),
    );
  });

  it("asks which asset of the account's network to buy in the asset drawer", () => {
    const { result } = renderPort(accountWithToken);

    act(() => result.current.port.onAction("buy"));

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: "buy",
        useCase: "buy",
        currencies: [ETH],
        areCurrenciesFiltered: true,
        completionMode: "currency",
        assetsConfiguration: { rightElement: "marketTrend" },
        networksConfiguration: { rightElement: "undefined" },
      }),
    );
    expect(result.current.assetPicker.isOpen).toBe(false);

    pickInDrawer(usdcToken);

    expect(mockOpenBuySellForAccount).toHaveBeenCalledWith(
      "buy",
      expect.objectContaining({ id: usdcAccount.id }),
      expect.objectContaining({ id: accountWithToken.id }),
    );
  });

  it("buys a token the account doesn't hold yet on that token", () => {
    const { result } = renderPort(accountWithToken);

    act(() => result.current.port.onAction("buy"));
    pickInDrawer(maticEth);

    expect(mockOpenBuySellForCurrency).toHaveBeenCalledWith("buy", maticEth);
    expect(mockOpenBuySellForAccount).not.toHaveBeenCalled();
  });

  it("swaps into the account's held asset picked in the asset drawer", () => {
    const { result } = renderPort(accountWithToken);

    act(() => result.current.port.onAction("swap"));

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "swap", useCase: "swap", currencies: [ETH] }),
    );

    pickInDrawer(usdcToken);

    expect(mockOpenSwapForAccount).toHaveBeenCalledWith(
      expect.objectContaining({ id: usdcAccount.id }),
      expect.objectContaining({ id: accountWithToken.id }),
    );
  });

  it("swaps into the account for a token it doesn't hold yet", () => {
    const { result } = renderPort(accountWithToken);

    act(() => result.current.port.onAction("swap"));
    pickInDrawer(maticEth);

    expect(mockOpenSwapForAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "TokenAccount",
        token: maticEth,
        parentId: accountWithToken.id,
      }),
      expect.objectContaining({ id: accountWithToken.id }),
    );
  });

  it("lets the asset drawer resolve a network without tokens", () => {
    const bitcoinAccount = withBalance(
      genAccount("account-detail-hero-btc", {
        currency: getCryptoCurrencyById("bitcoin"),
        operationsSize: 1,
      }),
      "100000",
    );
    setAvailability({ buy: ["bitcoin"] });
    const { result } = renderPort(bitcoinAccount);

    act(() => result.current.port.onAction("buy"));

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "buy", currencies: ["bitcoin"] }),
    );

    pickInDrawer(bitcoinAccount.currency);

    expect(mockOpenBuySellForAccount).toHaveBeenCalledWith(
      "buy",
      expect.objectContaining({ id: bitcoinAccount.id }),
      undefined,
    );
  });

  it("marks receive as unsupported for a family that can't receive", () => {
    const hypercoreAccount: Account = {
      ...fundedAccount,
      currency: { ...fundedAccount.currency, family: "hypercore" },
    };
    const { result } = renderPort(hypercoreAccount);

    expect(result.current.port.availability).toEqual(
      expect.objectContaining({ isSendSupported: false, isReceiveSupported: false }),
    );
  });

  it("asks which asset to sell among the account's assets with a balance", () => {
    const { result } = renderPort(accountWithToken);

    act(() => result.current.port.onAction("sell"));

    expect(result.current.assetPicker.isOpen).toBe(true);
    expect(result.current.assetPicker.assets.map(({ currency }) => currency.id)).toEqual([
      ETH,
      usdcToken.id,
    ]);

    const [, usdcAsset] = result.current.assetPicker.assets;
    act(() => result.current.assetPicker.onSelect(usdcAsset));

    expect(mockOpenBuySellForAccount).toHaveBeenCalledWith(
      "sell",
      expect.objectContaining({ id: usdcAccount.id }),
      expect.objectContaining({ id: accountWithToken.id }),
    );
  });

  it("opens Sell directly when only one asset qualifies", () => {
    setAvailability({ sell: [usdcToken.id] });
    const { result } = renderPort(accountWithToken);

    act(() => result.current.port.onAction("sell"));

    expect(result.current.assetPicker.isOpen).toBe(false);
    expect(mockOpenBuySellForAccount).toHaveBeenCalledWith(
      "sell",
      expect.objectContaining({ id: usdcAccount.id }),
      expect.objectContaining({ id: accountWithToken.id }),
    );
  });
});
