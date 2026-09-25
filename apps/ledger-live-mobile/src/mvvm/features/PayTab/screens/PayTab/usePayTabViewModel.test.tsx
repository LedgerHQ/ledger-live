import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { openHostedUrlInSecureBrowser } from "@features/flow-pay-card-auth";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { readCardUsEnv } from "@features/platform-card";
import { NavigatorName, ScreenName } from "~/const";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import type { PayTabNavigatorParamList } from "../../types";
import { usePayTabViewModel } from "./usePayTabViewModel";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";

const payAnalyticsAdapter = { track: () => undefined };

// ledger-live-mobile does not depend on expo-web-browser directly — only
// @features/flow-pay-card-auth does, and importing it here would fail typecheck since the app has
// no types for it. The login path still reaches it, so the whole module stays mocked.
jest.mock("@features/flow-pay-card-auth", () => ({
  ...jest.requireActual("@features/flow-pay-card-auth"),
  openHostedUrlInSecureBrowser: jest.fn(() => Promise.resolve({ type: "dismissed" })),
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  readCardUsEnv: jest.fn(),
}));

// Untyped: the Base stub screen below does not belong to the Pay tab's own param list.
const Stack = createNativeStackNavigator();

const mockedOpenSecureBrowser = jest.mocked(openHostedUrlInSecureBrowser);
const mockedManifest = jest.mocked(useLiveAppManifest);
const mockedReadCardUsEnv = jest.mocked(readCardUsEnv);

const HOSTED_MANIFEST = { id: "baanx-hosted-url", url: "https://ledger.baanxapi.test" };

const HOSTED_UI = "https://hosted.test";

const CARD_ASSET: CardAssetRow = {
  id: "wallet-btc",
  address: "bc1qcardwallet",
  currency: "btc",
  network: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerId: "bitcoin",
  cryptoAmount: "0.1 BTC",
  countervalue: "$100.00",
  countervalueAmount: 100,
};

const HOSTED_TOP_UP_ASSET: CardAssetRow = {
  ...CARD_ASSET,
  id: "wallet-eurc",
  address: "0xcardwallet",
  currency: "eurc",
  network: "ethereum",
  name: "EURC",
  ticker: "EURC",
  ledgerId: "",
  cryptoAmount: "100 EURC",
};

function PayTabViewModelProbe() {
  const { card } = usePayTabViewModel();
  const {
    login,
    onTopUp,
    onChooseCardType,
    onViewRewards,
    assets: cardAssets,
    cardSettingsActions,
    formatters,
  } = card;
  const { oauthConfig, callback } = login;
  const formatted = formatters?.countervalue?.(1250);

  return (
    <>
      <Text testID="oauth-api-url">{oauthConfig.apiUrl}</Text>
      <Text testID="oauth-client-id">{oauthConfig.clientId}</Text>
      <Text testID="oauth-hosted-ui">{oauthConfig.hostedUiUrl}</Text>
      <Text testID="oauth-redirect">{oauthConfig.redirectUri}</Text>
      <Text testID="oauth-deeplink">{oauthConfig.deepLink}</Text>
      <Text testID="oauth-callback">{JSON.stringify(callback)}</Text>
      <Text testID="countervalue-integer">{formatted?.integerPart}</Text>
      <Text testID="countervalue-decimal">{formatted?.decimalPart}</Text>
      <Pressable testID="top-up" onPress={onTopUp} />
      <Pressable testID="choose-card-type" onPress={onChooseCardType} />
      <Pressable testID="view-rewards" onPress={onViewRewards} />
      <Pressable testID="asset-top-up" onPress={() => cardAssets?.onTopUp?.(CARD_ASSET)} />
      <Pressable
        testID="hosted-asset-top-up"
        onPress={() => cardAssets?.onTopUp?.(HOSTED_TOP_UP_ASSET)}
      />
      <Pressable testID="asset-withdraw" onPress={() => cardAssets?.onWithdraw?.(CARD_ASSET)} />
      <Text testID="has-manage-pin">
        {String(typeof cardSettingsActions?.onManagePin === "function")}
      </Text>
      <Text testID="has-access-baanx">
        {String(typeof cardSettingsActions?.onAccessBaanx === "function")}
      </Text>
      <Pressable testID="press-manage-pin" onPress={cardSettingsActions?.onManagePin} />
      <Pressable testID="press-access-baanx" onPress={cardSettingsActions?.onAccessBaanx} />
      <Pressable testID="press-add-asset" onPress={cardAssets?.onAddAsset} />
      <Text testID="login-open-hosted-page">{String(login.openHostedPage)}</Text>
    </>
  );
}

// Every hosted page leaves the Pay tab for a live app under the Base navigator. A stub screen of
// that name reports the route, the manifest and the URL the view model asked for.
function BaseNavigatorProbe({
  route,
}: {
  route: { params?: { screen?: string; params?: { platform?: string; goToURL?: string } } };
}) {
  return (
    <>
      <Text testID="base-screen">{String(route.params?.screen)}</Text>
      <Text testID="base-platform">{String(route.params?.params?.platform)}</Text>
      <Text testID="base-goto">{String(route.params?.params?.goToURL)}</Text>
    </>
  );
}

function renderViewModel(
  params?: PayTabNavigatorParamList[typeof ScreenName.PayTab],
  options?: Parameters<typeof render>[1],
) {
  return render(
    <PayAnalyticsProvider adapter={payAnalyticsAdapter}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={ScreenName.PayTab}
          component={PayTabViewModelProbe}
          initialParams={params}
        />
        <Stack.Screen name={NavigatorName.Base} component={BaseNavigatorProbe} />
      </Stack.Navigator>
    </PayAnalyticsProvider>,
    options,
  );
}

function renderViewModelWithLegacyTopUp() {
  return renderViewModel(undefined, {
    overrideInitialState: withFlagOverrides({ lwmPayTab: { params: { legacyTopUp: true } } }),
  });
}

async function expectHostedPage(url: string) {
  await waitFor(() => expect(screen.getByTestId("base-goto")).toHaveTextContent(url));
  expect(screen.getByTestId("base-screen")).toHaveTextContent("PlatformApp");
  expect(screen.getByTestId("base-platform")).toHaveTextContent("baanx-hosted-url");
}

async function expectSecureBrowser(url: string) {
  await waitFor(() => expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(url, PAY_TAB_DEEP_LINK));
  expect(screen.queryByTestId("base-screen")).toBeNull();
}

describe("usePayTabViewModel", () => {
  beforeEach(() => {
    mockedOpenSecureBrowser.mockClear();
    setEnv("CARD_BAANX_HOSTED_UI", HOSTED_UI);
    mockedReadCardUsEnv.mockResolvedValue(false);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedManifest.mockReturnValue(HOSTED_MANIFEST as ReturnType<typeof useLiveAppManifest>);
  });

  afterEach(() => {
    setEnv("CARD_BAANX_API_URL", getEnvDefault("CARD_BAANX_API_URL"));
    setEnv("CARD_BAANX_CLIENT_KEY", getEnvDefault("CARD_BAANX_CLIENT_KEY"));
    setEnv("CARD_BAANX_HOSTED_UI", getEnvDefault("CARD_BAANX_HOSTED_UI"));
    setEnv("CARD_BAANX_US_APP_ID", getEnvDefault("CARD_BAANX_US_APP_ID"));
  });

  it("should expose the OAuth client configuration", () => {
    renderViewModel();

    expect(screen.getByTestId("oauth-api-url")).toHaveTextContent(getEnv("CARD_BAANX_API_URL"));
    expect(screen.getByTestId("oauth-client-id")).toHaveTextContent(
      getEnv("CARD_BAANX_CLIENT_KEY"),
    );
    expect(screen.getByTestId("oauth-hosted-ui")).toHaveTextContent(getEnv("CARD_BAANX_HOSTED_UI"));
    expect(screen.getByTestId("oauth-redirect")).toHaveTextContent(
      getEnv("CARD_OAUTH_REDIRECT_URI"),
    );
    expect(screen.getByTestId("oauth-deeplink")).toHaveTextContent(PAY_TAB_DEEP_LINK);
    expect(screen.getByTestId("countervalue-integer")).toHaveTextContent("12");
    expect(screen.getByTestId("countervalue-decimal")).toHaveTextContent("50");
  });

  it("should follow a change of the Card env vars", () => {
    // What the debug settings do. The login has to take the new tenant without a restart.
    renderViewModel();

    act(() => {
      setEnv("CARD_BAANX_API_URL", "https://card.staging.test");
      setEnv("CARD_BAANX_CLIENT_KEY", "staging-client-key");
      setEnv("CARD_BAANX_HOSTED_UI", "https://hosted.staging.test");
    });

    expect(screen.getByTestId("oauth-api-url")).toHaveTextContent("https://card.staging.test");
    expect(screen.getByTestId("oauth-client-id")).toHaveTextContent("staging-client-key");
    expect(screen.getByTestId("oauth-hosted-ui")).toHaveTextContent("https://hosted.staging.test");
  });

  it("should open the top up page of the hosted UI on the Baanx manifest", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("top-up"));

    await expectHostedPage("https://ledger.baanxapi.test/topup");
    expect(mockedOpenSecureBrowser).not.toHaveBeenCalled();
  });

  it("should open the choose card type page of the hosted UI in the secure browser", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("choose-card-type"));

    await expectSecureBrowser("https://hosted.test/order-card");
  });

  it("should name the US app on the choose card type page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("choose-card-type"));

    await expectSecureBrowser("https://hosted.test/order-card?app_id=LEDGERUS");
  });

  it("should open the cashback page of the hosted UI in the secure browser", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("view-rewards"));

    await expectSecureBrowser("https://hosted.test/cashback");
  });

  it("should name the US app on the cashback page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("view-rewards"));

    await expectSecureBrowser("https://hosted.test/cashback?app_id=LEDGERUS");
  });

  it("should leave signup to the secure browser of the login flow", () => {
    renderViewModel();

    expect(screen.getByTestId("login-open-hosted-page")).toHaveTextContent("undefined");
  });

  it("should pre-select on the hosted page the asset the user topped up from", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("asset-top-up"));

    await expectHostedPage("https://ledger.baanxapi.test/topup?currency=btc");
    expect(mockedOpenSecureBrowser).not.toHaveBeenCalled();
  });

  it("should pre-select on the hosted page a card wallet Ledger Wallet has no currency for", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("hosted-asset-top-up"));

    await expectHostedPage("https://ledger.baanxapi.test/topup?currency=eurc");
  });

  it("should open the legacy card live app on top up when the legacyTopUp param is on", async () => {
    const { user } = renderViewModelWithLegacyTopUp();

    await user.press(screen.getByTestId("top-up"));

    await waitFor(() => expect(screen.getByTestId("base-screen")).toHaveTextContent("PlatformApp"));
    expect(screen.getByTestId("base-platform")).toHaveTextContent("cl-card");
    expect(mockedOpenSecureBrowser).not.toHaveBeenCalled();
  });

  it("should open the legacy card live app from an asset too, and drop its currency", async () => {
    const { user } = renderViewModelWithLegacyTopUp();

    await user.press(screen.getByTestId("asset-top-up"));

    await waitFor(() => expect(screen.getByTestId("base-platform")).toHaveTextContent("cl-card"));
    expect(mockedOpenSecureBrowser).not.toHaveBeenCalled();
  });

  it("should open the withdrawal page of the hosted UI for the asset", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("asset-withdraw"));

    await expectSecureBrowser("https://hosted.test/withdrawal?app_id=LEDGERUS&currency=btc");
  });

  it("should name the US app on the top up page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("top-up"));

    await expectHostedPage("https://ledger.baanxapi.test/topup?app_id=LEDGERUS");
  });

  it("should hand the login flow the redirect the deep link carried", () => {
    renderViewModel({ code: "auth-code" });

    expect(screen.getByTestId("oauth-callback")).toHaveTextContent(
      JSON.stringify({ code: "auth-code" }),
    );
  });

  it("should hand the login flow the provider app the redirect named", () => {
    // React-navigation hands over the provider's own spelling. A rename or an omission here would
    // silently stop every US request from carrying `x-us-env`.
    renderViewModel({ code: "auth-code", app_id: "LEDGERUS" });

    expect(screen.getByTestId("oauth-callback")).toHaveTextContent(
      JSON.stringify({ code: "auth-code", appId: "LEDGERUS" }),
    );
  });

  it.each([
    ["there are no params", undefined],
    ["the code is missing", {}],
    ["the code is missing but an app id is not", { app_id: "LEDGERUS" }],
  ])("should report no redirect when %s", (_case, params) => {
    renderViewModel(params);

    expect(screen.getByTestId("oauth-callback")).toHaveTextContent("null");
  });

  it("should expose the manage PIN and access Baanx redirect actions", () => {
    renderViewModel();

    expect(screen.getByTestId("has-manage-pin")).toHaveTextContent("true");
    expect(screen.getByTestId("has-access-baanx")).toHaveTextContent("true");
  });

  it("should open the manage PIN hosted page in the secure browser", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("press-manage-pin"));

    await expectSecureBrowser("https://hosted.test/set-pin");
  });

  it("should name the US app on the manage PIN hosted page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("press-manage-pin"));

    await expectSecureBrowser("https://hosted.test/set-pin?app_id=LEDGERUS");
  });

  it("should open the access Baanx hosted page in the secure browser", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("press-access-baanx"));

    await expectSecureBrowser("https://hosted.test/");
  });

  it("should name the US app on the access Baanx hosted page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("press-access-baanx"));

    await expectSecureBrowser("https://hosted.test/?app_id=LEDGERUS");
  });

  it("should open the add asset hosted crypto dashboard in the secure browser", async () => {
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("press-add-asset"));

    await expectSecureBrowser("https://hosted.test/dashboard/accounts/crypto");
  });

  it("should name the US app on the add asset hosted crypto dashboard", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("press-add-asset"));

    await expectSecureBrowser("https://hosted.test/dashboard/accounts/crypto?app_id=LEDGERUS");
  });

  it("should report a warning instead of throwing when the top up page fails to open", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    // No manifest in the catalog: the opener throws, and the caller has to swallow it.
    mockedManifest.mockReturnValue(undefined);
    const { user } = renderViewModel();

    await user.press(screen.getByTestId("top-up"));

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        "[card] the hosted asset page did not open",
        expect.any(Error),
      ),
    );

    warn.mockRestore();
  });
});
