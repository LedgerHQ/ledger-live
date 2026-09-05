import React from "react";
import { Text } from "react-native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { server, http, HttpResponse, delay } from "@tests/server";
import { mockData } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";
import { mockStablecoinsResponse } from "@domain/api-aggregated-assets/mock/stablecoins";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import type { Contact } from "@domain/entity-contact";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import PayTabNavigator from "LLM/features/PayTab";
import { PayTabRequestReceiveScreen } from "LLM/features/PayTab/screens/RequestReceive";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";

export const EMPTY_TITLE = "Pay and get paid";
export const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";
export const FEATURE_TOUR_ROW = "Request payments";
export const FEATURE_TOUR_CTA = "Explore Pay";

const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
export const usdc = TokenCurrencySchema.parse({
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
export const payTabEthAccount = genAccount("pay-tab-eth", { currency: ethereum });
const payTabUsdcAccount = genTokenAccount(0, payTabEthAccount, usdc);
const payTabUniAccount = genTokenAccount(0, payTabEthAccount, uni);

type TestStackParamList = {
  PayTabTest: undefined;
  [NavigatorName.ReceiveFunds]: {
    screen: ScreenName.ReceiveProvider;
    params: { manifestId: string; fromMenu: boolean; noahAuth?: "createAccount" | "logIn" };
  };
  [NavigatorName.MyWallet]:
    | {
        screen: typeof ScreenName.MyWalletContacts;
        params?: { title?: string };
      }
    | {
        screen: typeof ScreenName.MyWalletContactDetail;
        params: { contactId: string };
      }
    | undefined;
  [NavigatorName.SendFunds]:
    | {
        screen: ScreenName.SendCoin;
        params?: { currencyIds?: string[] };
      }
    | undefined;
  [NavigatorName.SendFlow]:
    | {
        params?: { selectContactBeforeAccount?: boolean; account?: { id: string } };
      }
    | undefined;
};

const RootStack = createNativeStackNavigator<{ [NavigatorName.Base]: undefined }>();
const Stack = createNativeStackNavigator<TestStackParamList>();
const RequestStack = createNativeStackNavigator<PayTabNavigatorParamList>();

function ReceiveFundsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, NavigatorName.ReceiveFunds>) {
  return (
    <Text testID="receive-funds-screen">
      {route.params.screen}:{route.params.params.manifestId}
    </Text>
  );
}

function MyWalletContactsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, NavigatorName.MyWallet>) {
  const screenName = route.params?.screen;
  const params = route.params?.params;
  const detail = params && "contactId" in params ? params.contactId : undefined;
  const title = params && "title" in params ? params.title : undefined;

  return (
    <Text
      testID={
        screenName === ScreenName.MyWalletContactDetail
          ? "my-wallet-contact-detail-screen"
          : "my-wallet-contacts-screen"
      }
    >
      {[screenName, title ?? detail].filter(Boolean).join(":")}
    </Text>
  );
}

function SendFundsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, NavigatorName.SendFunds>) {
  return (
    <Text testID="send-funds-screen">
      {route.params?.screen}:{route.params?.params?.currencyIds?.join(",") ?? ""}
    </Text>
  );
}

function SendFlowScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, NavigatorName.SendFlow>) {
  const params = route.params?.params;
  const label = params?.selectContactBeforeAccount
    ? "selectContactBeforeAccount"
    : params?.account
      ? `send:${params.account.id}`
      : "";

  return <Text testID="send-flow-screen">{label}</Text>;
}

function AppBase() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="PayTabTest" component={PayTabNavigator} />
      <Stack.Screen name={NavigatorName.ReceiveFunds} component={ReceiveFundsScreen} />
      <Stack.Screen name={NavigatorName.MyWallet} component={MyWalletContactsScreen} />
      <Stack.Screen name={NavigatorName.SendFunds} component={SendFundsScreen} />
      <Stack.Screen name={NavigatorName.SendFlow} component={SendFlowScreen} />
    </Stack.Navigator>
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
  contacts?: Contact[];
  contactsEnabled?: boolean;
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

export function seedContacts(count: number): Contact[] {
  return [
    mockMeContact(),
    ...Array.from({ length: count }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    ),
  ];
}

function dadaResponse(request: Request) {
  const categories = new URL(request.url).searchParams.get("categories");
  if (categories === "stablecoins") return HttpResponse.json(mockStablecoinsResponse);
  return HttpResponse.json(mockData);
}

export function setDada(mode: "hang" | "error") {
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

export function holdDada() {
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

export function mockFullAssetCatalog() {
  server.use(...DADA_URLS.map(url => http.get(url, () => HttpResponse.json(mockData))));
}

export function renderPayTab({
  hasSeenFeatureTour = true,
  holdsUsdc = false,
  holdsEmptyUsdc = false,
  holdsUni = false,
  cryptoOnly = false,
  contacts,
  contactsEnabled = false,
}: RenderPayTabOptions = {}) {
  return render(
    <>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        <RootStack.Screen name={NavigatorName.Base} component={AppBase} />
      </RootStack.Navigator>
      <ModularDrawerWrapper />
    </>,
    {
      overrideInitialState: withFlagOverrides(
        {
          llmModularDrawer: {
            enabled: true,
            params: { enableModularization: true, searchDebounceTime: 0 },
          },
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
          ...(contactsEnabled
            ? { lwmContacts: { enabled: true, params: { newBadge: false } } }
            : {}),
        },
        state => {
          const next: State = {
            ...state,
            payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour },
            ...(contacts ? { contacts: { contacts } } : {}),
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

export async function selectUsdcOnEthereum(user: Awaited<ReturnType<typeof renderPayTab>>["user"]) {
  await user.press(await screen.findByTestId("action-tile-request"));
  await user.press(await screen.findByTestId("asset-item-USDC"));
  expect(await screen.findByText(/select network/i)).toBeVisible();
  await user.press(await screen.findByTestId("network-item-Ethereum"));
  expect(await screen.findByText(/select account/i)).toBeVisible();
  await user.press(await screen.findByTestId("account-item"));
}

export function renderRequestReceive(
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
