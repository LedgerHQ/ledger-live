import React from "react";
import { Text, View } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { render, screen, waitFor, within, withFlagOverrides } from "@tests/test-renderer";
import { server, http, HttpResponse, delay } from "@tests/server";
import { mockData } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";
import { mockStablecoinsResponse } from "@domain/api-aggregated-assets/mock/stablecoins";
import { PAY_CARD_BALANCE_FILTER_ALL } from "@features/flow-pay-balance/state";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { screen as trackScreen } from "~/analytics/segment";
import type { State } from "~/reducers/types";
import PayTabNavigator from "LLM/features/PayTab";
import { PayTabRequestReceiveScreen } from "LLM/features/PayTab/screens/RequestReceive";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
}));

jest.mock("@features/flow-pay-card", () => ({
  Card: () => (
    <>
      <View testID="card-login" />
      <View testID="card-logout" />
    </>
  ),
}));

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";
const FEATURE_TOUR_ROW = "Minimal volatility";
const FEATURE_TOUR_CTA = "Got it";

const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const usdc = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: ethereum.id,
  contractAddress: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
  tokenType: "erc20",
  ticker: "USDC",
  name: "USD Coin",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});
const uni = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/uniswap",
  parentCurrencyId: ethereum.id,
  contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  tokenType: "erc20",
  ticker: "UNI",
  name: "Uniswap",
  units: [{ name: "Uniswap", code: "UNI", magnitude: 18 }],
});
const payTabEthAccount = genAccount("pay-tab-eth", { currency: ethereum });
const payTabUsdcAccount = genTokenAccount(0, payTabEthAccount, usdc);
const payTabUniAccount = genTokenAccount(0, payTabEthAccount, uni);

type TestStackParamList = {
  PayTabTest: undefined;
  [NavigatorName.ReceiveFunds]: {
    screen: ScreenName.ReceiveProvider;
    params: { manifestId: string; fromMenu: boolean };
  };
};

const Stack = createNativeStackNavigator<TestStackParamList>();

function ReceiveFundsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, NavigatorName.ReceiveFunds>) {
  return (
    <Text testID="receive-funds-screen">
      {route.params.screen}:{route.params.params.manifestId}
    </Text>
  );
}

const DADA_URLS = [
  "https://dada.api.ledger-test.com/v1/assets",
  "https://dada.api.ledger.com/v1/assets",
];

type RenderPayTabOptions = Readonly<{
  hasSeenFeatureTour?: boolean;
  holdsUsdc?: boolean;
  holdsEmptyUsdc?: boolean;
  holdsUni?: boolean;
  cryptoOnly?: boolean;
}>;

function withUsdcHoldings(state: State): State {
  return {
    ...state,
    accounts: { active: [{ ...payTabEthAccount, subAccounts: [payTabUsdcAccount] }] },
    countervalues: {
      ...state.countervalues,
      countervalues: {
        ...state.countervalues.countervalues,
        state: importCountervalues(
          { status: {}, [pairId({ from: usdc, to: usd })]: { latest: 1 } },
          state.countervalues.userSettings,
        ),
      },
    },
  };
}

function withEmptyUsdcHoldings(state: State): State {
  const emptyUsdc = makeEmptyTokenAccount(payTabEthAccount, usdc);
  return {
    ...state,
    accounts: { active: [{ ...payTabEthAccount, subAccounts: [emptyUsdc] }] },
  };
}

function withCryptoOnly(state: State): State {
  return {
    ...state,
    accounts: { active: [{ ...payTabEthAccount, subAccounts: [] }] },
  };
}

function withUniHoldings(state: State): State {
  return {
    ...state,
    accounts: { active: [{ ...payTabEthAccount, subAccounts: [payTabUniAccount] }] },
  };
}

function dadaResponse(request: Request) {
  const categories = new URL(request.url).searchParams.get("categories");
  if (categories === "stablecoins") return HttpResponse.json(mockStablecoinsResponse);
  return HttpResponse.json(mockData);
}

function setDada(mode: "hang" | "error") {
  server.use(
    ...DADA_URLS.map(url =>
      http.get(url, async ({ request }) => {
        if (mode === "hang") await delay("infinite");
        const isAmountQuery = new URL(request.url).searchParams.has("currencyIds");
        if (isAmountQuery && mode === "error") return HttpResponse.json(null, { status: 500 });
        return dadaResponse(request);
      }),
    ),
  );
}

function holdDada() {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  server.use(
    ...DADA_URLS.map(url =>
      http.get(url, async ({ request }) => {
        await gate;
        return dadaResponse(request);
      }),
    ),
  );
  return () => release();
}

function mockFullAssetCatalog() {
  server.use(...DADA_URLS.map(url => http.get(url, () => HttpResponse.json(mockData))));
}

function renderPayTab({
  hasSeenFeatureTour = true,
  holdsUsdc = false,
  holdsEmptyUsdc = false,
  holdsUni = false,
  cryptoOnly = false,
}: RenderPayTabOptions = {}) {
  return render(
    <>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="PayTabTest" component={PayTabNavigator} />
        <Stack.Screen name={NavigatorName.ReceiveFunds} component={ReceiveFundsScreen} />
      </Stack.Navigator>
      <ModularDrawerWrapper />
    </>,
    {
      overrideInitialState: withFlagOverrides(
        {
          llmModularDrawer: {
            enabled: true,
            params: { enableModularization: true, searchDebounceTime: 0 },
          },
        },
        state => {
          const next: State = {
            ...state,
            payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour },
          };
          if (holdsUsdc) return withUsdcHoldings(next);
          if (holdsEmptyUsdc) return withEmptyUsdcHoldings(next);
          if (holdsUni) return withUniHoldings(next);
          if (cryptoOnly) return withCryptoOnly(next);
          return next;
        },
      ),
    },
  );
}

async function selectUsdcOnEthereum(user: Awaited<ReturnType<typeof renderPayTab>>["user"]) {
  await user.press(await screen.findByTestId("action-tile-request"));
  await user.press(await screen.findByTestId("asset-item-USDC"));
  expect(await screen.findByText(/select network/i)).toBeVisible();
  await user.press(await screen.findByTestId("network-item-Ethereum"));
  expect(await screen.findByText(/select account/i)).toBeVisible();
  await user.press(await screen.findByTestId("account-item"));
}

const RequestStack = createNativeStackNavigator<PayTabNavigatorParamList>();

function renderRequestReceive(
  params: PayTabNavigatorParamList[typeof ScreenName.PayTabRequestReceive] = {
    accountId: payTabEthAccount.id,
    parentId: payTabEthAccount.id,
    currency: usdc,
  },
) {
  return render(
    <RequestStack.Navigator
      screenOptions={{ headerShown: false, animation: "none" }}
      initialRouteName={ScreenName.PayTabRequestReceive}
    >
      <RequestStack.Screen
        name={ScreenName.PayTabRequestReceive}
        component={PayTabRequestReceiveScreen}
        initialParams={params}
      />
    </RequestStack.Navigator>,
    { overrideInitialState: withUsdcHoldings },
  );
}

describe("PayTab integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("feature tour", () => {
    it("should show the feature tour on first visit", async () => {
      renderPayTab({ hasSeenFeatureTour: false });

      expect(screen.getByTestId("paytab-screen")).toBeVisible();
      await waitFor(() => {
        expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
      });
    });

    it("should persist dismissal and hide the tour after pressing Got it", async () => {
      const { user, store } = renderPayTab({ hasSeenFeatureTour: false });

      await waitFor(() => {
        expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
      });

      await user.press(screen.getByText(FEATURE_TOUR_CTA));

      await waitFor(() => {
        expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
        expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
      });
    });

    it("should not show the feature tour once it has been seen", () => {
      renderPayTab();

      expect(screen.getByTestId("paytab-screen")).toBeVisible();
      expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
    });
  });

  describe("balance", () => {
    it("should render the empty hero when the user holds no stablecoins", async () => {
      renderPayTab();

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.getByText(EMPTY_TITLE)).toBeVisible();
      expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
      expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
      expect(screen.getByTestId("action-tile-request")).toBeVisible();
    });

    it("should render the aggregated stablecoin balance when the user holds stablecoins", async () => {
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should render the empty hero when the user holds USDC with a zero balance", async () => {
      renderPayTab({ holdsEmptyUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should render the empty hero when accounts hold only crypto", async () => {
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should stay empty while DADA hangs if the user holds no stablecoins", async () => {
      setDada("hang");
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should stay funded while the catalog hangs if the user holds USDC", async () => {
      setDada("hang");
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should stay empty when DADA fails if the user holds no stablecoins", async () => {
      setDada("error");
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should stay funded when DADA fails if the user holds USDC", async () => {
      setDada("error");
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should become funded when DADA resolves a USDC holding", async () => {
      const release = holdDada();
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      release();
      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should stay empty when DADA resolves with no stablecoin holding", async () => {
      const release = holdDada();
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      release();
      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should be funded while DADA hangs if the user holds UNI, then empty when it resolves", async () => {
      const release = holdDada();
      renderPayTab({ holdsUni: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
      release();
      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should render Deposit and Request action tiles when the hero is funded", async () => {
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("action-tile-deposit")).toBeVisible();
      expect(screen.getByTestId("action-tile-request")).toBeVisible();
      expect(screen.getByText("Add stablecoin")).toBeVisible();
      expect(screen.getByText("Request")).toBeVisible();
    });

    it("should track button_clicked with quick_action location when an action tile is pressed", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "deposit",
        buttonLocation: "quick_action",
        page: "Pay",
      });

      await user.press(screen.getByTestId("action-tile-request"));

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "request",
        buttonLocation: "quick_action",
        page: "Pay",
      });
    });

    it("should track the Pay page with the active balance filter on view", async () => {
      renderPayTab();

      await waitFor(() => {
        const [category, , properties] = jest.mocked(trackScreen).mock.calls[0] ?? [];
        expect(category).toBe("Pay");
        expect(properties).toEqual(expect.objectContaining({ balance_filter: "all" }));
      });
    });

    it("should still render the card login block below the hero", async () => {
      renderPayTab();

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
    });

    it("should open the balance filter bottom sheet from the hero pill and track the interaction", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      const pill = await screen.findByTestId("pay-card-balance-filter-pill");
      expect(pill).toBeVisible();

      await user.press(pill);

      expect(await screen.findByTestId("pay-card-balance-filter-picker")).toBeVisible();
      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "balance_filter",
      });
    });

    it("should persist the selected stablecoin, update the hero pill and track the confirmation", async () => {
      const { user, store } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("pay-card-balance-filter-pill"));

      await user.press(await screen.findByTestId("pay-card-balance-filter-option-usdc"));
      await user.press(screen.getByTestId("pay-card-balance-filter-confirm"));

      await waitFor(() => {
        expect(store.getState().payCardBalance.balanceFilter).not.toBe(PAY_CARD_BALANCE_FILTER_ALL);
      });

      const pill = screen.getByTestId("pay-card-balance-filter-pill");
      expect(within(pill).getByText("USDC")).toBeVisible();

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "confirm_balance_filter",
        asset: "USDC",
      });
    });
  });

  describe("deposit options", () => {
    it("opens the deposit options bottom sheet with the four options from the deposit tile", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));

      expect(await screen.findByTestId("pay-card-deposit-options")).toBeVisible();
      expect(screen.getByText("Add stablecoins")).toBeVisible();
      (["bankTransfer", "swap", "receive", "buy"] as const).forEach(id => {
        expect(screen.getByTestId(`pay-card-deposit-option-${id}`)).toBeVisible();
      });
    });

    it("opens the modular asset drawer for the receive flow when the receive option is selected", async () => {
      const { user, store } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));
      await user.press(await screen.findByTestId("pay-card-deposit-option-receive"));

      await waitFor(() => {
        expect(store.getState().modularDrawer).toMatchObject({
          isOpen: true,
          flow: "receive_flow",
          source: "Pay",
          categories: [AssetCategory.Stablecoins],
        });
      });
    });

    it("navigates to the Noah fiat provider when the bank transfer option is selected", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));
      await user.press(await screen.findByTestId("pay-card-deposit-option-bankTransfer"));

      expect(await screen.findByTestId("receive-funds-screen")).toHaveTextContent(
        `${ScreenName.ReceiveProvider}:noah`,
      );
    });
  });

  describe("request", () => {
    it("opens the modular asset drawer for the request flow when the request tile is pressed", async () => {
      const { user, store } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-request"));

      await waitFor(() => {
        expect(store.getState().modularDrawer).toMatchObject({
          isOpen: true,
          flow: "request",
          source: "Pay",
          categories: [AssetCategory.Stablecoins],
          enableAccountSelection: true,
        });
      });
    });

    it("should open the request screen after selecting USDC on Ethereum", async () => {
      mockFullAssetCatalog();
      const { user } = renderPayTab({ holdsUsdc: true });

      await selectUsdcOnEthereum(user);

      expect(await screen.findByText("Request USD Coin")).toBeVisible();
      expect(screen.getByTestId("pay-card-request-receive")).toBeVisible();
      expect(screen.getByTestId("pay-card-request-receive-qr-code")).toBeVisible();
    });

    it("should render the request receive card for the selected account", async () => {
      renderRequestReceive();

      expect(await screen.findByText("Request USD Coin")).toBeVisible();
      expect(screen.getByTestId("pay-card-request-receive")).toBeVisible();
      expect(screen.getByTestId("pay-card-request-receive-card")).toBeVisible();
      expect(screen.getByText("Share")).toBeVisible();
    });

    it("should share a picture of the request card when Share is pressed", async () => {
      const { user } = renderRequestReceive();

      await user.press(await screen.findByText("Share"));

      await waitFor(() => {
        expect(captureRef).toHaveBeenCalledWith(expect.anything(), { format: "png" });
        expect(Share.open).toHaveBeenCalledWith({
          url: "file://mock.png",
          message: payTabEthAccount.freshAddress,
          failOnCancel: false,
        });
      });
    });

    it("should render an error when the account is missing", () => {
      renderRequestReceive({
        accountId: "missing-account",
        currency: usdc,
      });

      expect(screen.getByTestId("generic-error-modal")).toBeVisible();
      expect(screen.queryByTestId("pay-card-request-receive-qr-code")).toBeNull();
    });

    it("should show the parent address when the selected token is not yet a sub-account", async () => {
      mockFullAssetCatalog();
      const { user } = renderPayTab({ cryptoOnly: true });

      await selectUsdcOnEthereum(user);

      expect(await screen.findByText("Request USD Coin")).toBeVisible();
      expect(screen.getByTestId("pay-card-request-receive-qr-code")).toBeVisible();
    });
  });
});
