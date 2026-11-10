import React, { useEffect } from "react";
import { Text } from "react-native";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { track, trackPage } from "@shared/analytics";
import { act, fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { http, HttpResponse, server } from "@tests/server";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import {
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "LLM/features/ModularDrawer/analytics/modularDrawer.types";
import { OPERATIONS_HISTORY_TEST_IDS } from "LLM/features/OperationsHistory/testIds";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";
import {
  useAccountHeroPort,
  type AccountHeroPortResult,
} from "../screens/AccountDetail/components/Hero/useAccountHeroPort";

const mockOpenDrawer = jest.fn();
const mockOpenBuySellForAccount = jest.fn();
const ALL_AVAILABLE = [getCryptoCurrencyById("ethereum").id, usdcToken.id];

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ getSupportedCryptoCurrencyIds: () => ALL_AVAILABLE }),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag", () => ({
  useCurrenciesUnderFeatureFlag: () => ({ deactivatedCurrencyIds: new Set<string>() }),
}));

jest.mock("LLM/hooks/useStake/useStake", () => ({
  ...jest.requireActual("LLM/hooks/useStake/useStake"),
  useStake: () => ({
    ...jest.requireActual("LLM/hooks/useStake/useStake").useStake(),
    getCanStakeCurrency: (id: string) => id === "ethereum",
  }),
}));

jest.mock("LLM/features/Buy", () => ({
  ...jest.requireActual("LLM/features/Buy"),
  useOpenBuySell: () => ({
    handleOpenBuySell: jest.fn(),
    openBuySellForAccount: mockOpenBuySellForAccount,
    openBuySellForCurrency: jest.fn(),
  }),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  ...jest.requireActual("LLM/features/ModularDrawer"),
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

function withBalance<T extends Account | TokenAccount>(account: T, balance: string): T {
  return { ...account, balance: new BigNumber(balance), spendableBalance: new BigNumber(balance) };
}

const ethRoot = genAccount("account-detail-tracking-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});
const usdcAccount = withBalance(genTokenAccount(0, ethRoot, usdcToken), "5000000");
const ethAccount: Account = {
  ...withBalance(ethRoot, "1000000000000000000"),
  subAccounts: [usdcAccount],
};
const ethWithoutTokens: Account = { ...ethAccount, subAccounts: [] };

const COMMON = { network: "ethereum" };
const buttonClicked = (props: Record<string, unknown>) => [
  "button_clicked",
  { ...COMMON, ...props },
];

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function Stub({ route }: Readonly<{ route: { name: string } }>) {
  return <Text>{route.name}</Text>;
}

const withAccount =
  (account: Account) =>
  (state: State): State => {
    const withFlag = withFlagOverrides({
      accountDetail: { enabled: true },
      lwmWallet40: { enabled: true },
    })(state);
    return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
  };

function renderAccount(
  account: Account,
  params: BaseNavigatorStackParamList[ScreenName.Account] = { accountId: account.id },
) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.Account} component={AccountScreen} initialParams={params} />
      <Stack.Screen name={NavigatorName.OperationsHistory} component={Stub as never} />
      <Stack.Screen name={ScreenName.OperationDetails} component={Stub as never} />
      <Stack.Screen name={NavigatorName.AssetDetail} component={Stub as never} />
    </Stack.Navigator>,
    { overrideInitialState: withAccount(account) },
  );
}

const tile = (id: string) => `${ACCOUNT_DETAIL_TEST_IDS.hero}-actions-${id}`;
const moreItem = (id: string) => `${ACCOUNT_DETAIL_TEST_IDS.hero}-more-sheet-${id}`;
const trackedNames = () => jest.mocked(track).mock.calls.map(([name]) => name);

beforeEach(() => {
  server.use(
    http.get("*/currencies/all", () =>
      HttpResponse.json({
        from: [{ network: "ethereum", supportedCurrencies: ALL_AVAILABLE }],
        to: [],
      }),
    ),
  );
  jest.mocked(track).mockClear();
  jest.mocked(trackPage).mockClear();
  mockOpenDrawer.mockClear();
  mockOpenBuySellForAccount.mockClear();
});

describe("AccountDetail tracking: page", () => {
  it("tracks Page Account with the currency, the operations count and the tokens", async () => {
    renderAccount(ethAccount);
    await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.screen);

    expect(trackPage).toHaveBeenCalledWith(
      {
        category: "Account",
        name: undefined,
        props: { ...COMMON, operationsCount: ethAccount.operationsCount, hasTokens: true },
      },
      expect.objectContaining({ updateRoutes: true }),
    );
  });

  it("counts all the operations of the account, not only the loaded ones", async () => {
    const total = ethAccount.operations.length + 200;
    renderAccount({ ...ethAccount, operationsCount: total });
    await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.screen);

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Account",
        props: expect.objectContaining({ operationsCount: total }),
      }),
      expect.anything(),
    );
  });

  it("tells when the account holds no token", async () => {
    renderAccount(ethWithoutTokens);
    await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.screen);

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Account",
        props: expect.objectContaining({ hasTokens: false }),
      }),
      expect.anything(),
    );
  });

  it("tracks the parent account, never a token account, when opened from a token", async () => {
    renderAccount(ethAccount, { accountId: usdcAccount.id, parentId: ethAccount.id });
    await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.screen);

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Account",
        props: expect.objectContaining({ network: "ethereum" }),
      }),
      expect.anything(),
    );
  });
});

describe("AccountDetail tracking: quick actions", () => {
  it("tracks the Transfer tile as a quick action", async () => {
    const { user } = renderAccount(ethAccount);

    await user.press(await screen.findByTestId(tile("transfer")));

    expect(track).toHaveBeenCalledWith(
      ...buttonClicked({ button: "transfer", page: "Account", buttonLocation: "quick_action" }),
    );
  });

  it("tracks the Swap tile as a quick action", async () => {
    renderAccount(ethAccount);

    fireEvent.press(await screen.findByTestId(tile("swap")));

    expect(track).toHaveBeenCalledWith(
      ...buttonClicked({ button: "swap", page: "Account", buttonLocation: "quick_action" }),
    );
  });

  it("tracks the More tile", async () => {
    const { user } = renderAccount(ethAccount);

    await user.press(await screen.findByTestId(tile("more")));

    expect(track).toHaveBeenCalledWith(
      ...buttonClicked({ button: "More", page: "Account", buttonLocation: "quick_action" }),
    );
  });

  it("sends nothing when an action of the More sheet is picked", async () => {
    const { user } = renderAccount(ethAccount);
    await user.press(await screen.findByTestId(tile("more")));
    jest.mocked(track).mockClear();

    await user.press(screen.getByTestId(moreItem("buy")));

    expect(trackedNames()).not.toContain("button_clicked");
  });
});

describe("AccountDetail tracking: transactions", () => {
  it("tracks see all transactions", async () => {
    const { user } = renderAccount(ethAccount);

    await user.press(await screen.findByTestId(ACCOUNT_DETAIL_TEST_IDS.transactionsHeader));

    expect(track).toHaveBeenCalledWith(
      ...buttonClicked({ button: "see all transactions", page: "Account" }),
    );
  });

  it("tracks the type of the operation pressed", async () => {
    const [latest] = [...ethAccount.operations, ...usdcAccount.operations].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    const { user } = renderAccount(ethAccount);

    const [firstItem] = await screen.findAllByTestId(OPERATIONS_HISTORY_TEST_IDS.listItem);
    await user.press(firstItem);

    expect(track).toHaveBeenCalledWith("transaction_clicked", {
      ...COMMON,
      transaction: latest.type,
      page: "Account",
    });
  });
});

describe("AccountDetail tracking: assets", () => {
  it("tracks the ticker of the coin pressed", async () => {
    const { user } = renderAccount(ethAccount);

    await user.press(await screen.findByTestId("assetItem-Ethereum"));

    expect(track).toHaveBeenCalledWith("asset_clicked", {
      ...COMMON,
      asset: "ETH",
      page: "Account",
    });
  });

  it("tracks the ticker of the token pressed, still on the main account", async () => {
    const { user } = renderAccount(ethAccount);

    await user.press(await screen.findByTestId("assetItem-USD Coin"));

    expect(track).toHaveBeenCalledWith("asset_clicked", {
      ...COMMON,
      asset: "USDC",
      page: "Account",
    });
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
  render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ScreenName.Account} component={PortProbe} />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: { ...state.accounts, active: [account] },
      }),
    },
  );
  return result;
}

describe("AccountDetail tracking: asset picker", () => {
  it("tracks the picker page and the asset picked like the Modular Asset Drawer", () => {
    const port = renderPort(ethAccount);

    act(() => port.current.port.onAction("sell"));

    expect(trackPage).toHaveBeenCalledWith(
      {
        category: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
        props: {
          flow: "sell",
          source: "Account",
          asset_component_features: {
            balance: true,
            market_trend: false,
            apy: false,
            filter: false,
          },
        },
      },
      { updateRoutes: false },
    );

    jest.mocked(track).mockClear();
    act(() => port.current.assetPicker.onSelect(usdcToken.id));

    expect(track).toHaveBeenCalledWith(EVENTS_NAME.ASSET_CLICKED, {
      flow: "sell",
      source: "Account",
      asset_component_features: { balance: true, market_trend: false, apy: false, filter: false },
      asset: usdcToken.name,
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
    });
  });

  it("tracks the click of the action that opened the picker", () => {
    const port = renderPort(ethAccount);

    act(() => port.current.port.onAction("sell"));

    expect(track).toHaveBeenCalledWith(
      ...buttonClicked({ button: "sell", page: "Account", buttonLocation: "quick_action" }),
    );
  });
});
