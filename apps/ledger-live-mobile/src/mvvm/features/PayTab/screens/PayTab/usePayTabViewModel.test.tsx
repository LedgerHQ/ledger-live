import React from "react";
import { Linking, Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import {
  buildHostedUrl,
  MANAGE_PIN_PATH,
  buildAccessBaanxPath,
  openHostedUrlInSecureBrowser,
} from "@features/flow-pay-card-auth";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { readCardUsEnv } from "@features/platform-card";
import { NavigatorName, ScreenName } from "~/const";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import type { PayTabNavigatorParamList } from "../../types";
import { usePayTabViewModel } from "./usePayTabViewModel";

// ledger-live-mobile does not depend on expo-web-browser directly — only
// @features/flow-pay-card-auth does, wrapping it behind openHostedUrlInSecureBrowser. Importing
// expo-web-browser here would fail typecheck since the app has no types for it.
jest.mock("@features/flow-pay-card-auth", () => ({
  ...jest.requireActual("@features/flow-pay-card-auth"),
  openHostedUrlInSecureBrowser: jest.fn(() => Promise.resolve({ type: "dismissed" })),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  readCardUsEnv: jest.fn(),
}));

const Stack = createNativeStackNavigator<PayTabNavigatorParamList>();

const mockedOpenSecureBrowser = jest.mocked(openHostedUrlInSecureBrowser);
const mockedReadCardUsEnv = jest.mocked(readCardUsEnv);

const CARD_ASSET: CardAssetRow = {
  id: "wallet-btc",
  currency: "btc",
  network: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  ledgerId: "bitcoin",
  cryptoAmount: "0.1 BTC",
  countervalue: "$100.00",
  countervalueAmount: 100,
};

function PayTabViewModelProbe() {
  const { login, onTopUp, cardAssets, cardSettingsActions } = usePayTabViewModel();
  const { oauthConfig, callback } = login;

  return (
    <>
      <Text testID="oauth-api-url">{oauthConfig.apiUrl}</Text>
      <Text testID="oauth-client-id">{oauthConfig.clientId}</Text>
      <Text testID="oauth-hosted-ui">{oauthConfig.hostedUiUrl}</Text>
      <Text testID="oauth-redirect">{oauthConfig.redirectUri}</Text>
      <Text testID="oauth-deeplink">{oauthConfig.deepLink}</Text>
      <Text testID="oauth-callback">{JSON.stringify(callback)}</Text>
      <Pressable testID="top-up" onPress={onTopUp} />
      <Pressable testID="asset-top-up" onPress={() => cardAssets.onTopUp?.(CARD_ASSET)} />
      <Pressable testID="asset-withdraw" onPress={() => cardAssets.onWithdraw?.(CARD_ASSET)} />
      <Text testID="has-manage-pin">
        {String(typeof cardSettingsActions?.onManagePin === "function")}
      </Text>
      <Text testID="has-access-baanx">
        {String(typeof cardSettingsActions?.onAccessBaanx === "function")}
      </Text>
      <Pressable testID="press-help" onPress={cardSettingsActions?.onHelp} />
      <Pressable testID="press-manage-pin" onPress={cardSettingsActions?.onManagePin} />
      <Pressable testID="press-access-baanx" onPress={cardSettingsActions?.onAccessBaanx} />
    </>
  );
}

function renderViewModel(params?: PayTabNavigatorParamList[typeof ScreenName.PayTab]) {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.PayTab}
        component={PayTabViewModelProbe}
        initialParams={params}
      />
    </Stack.Navigator>,
  );
}

// The legacy top-up leaves the Pay tab for the Discover live app, which lives under the Base
// navigator. A stub screen of that name reports the route the view model asked for.
const LooseStack = createNativeStackNavigator();

function BaseNavigatorProbe({
  route,
}: {
  route: { params?: { screen?: string; params?: { platform?: string; name?: string } } };
}) {
  return (
    <>
      <Text testID="base-screen">{String(route.params?.screen)}</Text>
      <Text testID="base-platform">{String(route.params?.params?.platform)}</Text>
      <Text testID="base-name">{String(route.params?.params?.name)}</Text>
    </>
  );
}

function renderViewModelWithLegacyTopUp() {
  return render(
    <LooseStack.Navigator screenOptions={{ headerShown: false }}>
      <LooseStack.Screen name={ScreenName.PayTab} component={PayTabViewModelProbe} />
      <LooseStack.Screen name={NavigatorName.Base} component={BaseNavigatorProbe} />
    </LooseStack.Navigator>,
    {
      overrideInitialState: withFlagOverrides({ lwmPayTab: { params: { legacyTopUp: true } } }),
    },
  );
}

describe("usePayTabViewModel", () => {
  beforeEach(() => {
    mockedOpenSecureBrowser.mockClear();
    mockedReadCardUsEnv.mockResolvedValue(false);
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

  it("should open the top up page of the hosted UI in the secure browser", async () => {
    setEnv("CARD_BAANX_HOSTED_UI", "https://hosted.test");
    renderViewModel();

    fireEvent.press(screen.getByTestId("top-up"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        "https://hosted.test/topup",
        PAY_TAB_DEEP_LINK,
      ),
    );
  });

  it("should pre-select the asset the holder tops up from", async () => {
    setEnv("CARD_BAANX_HOSTED_UI", "https://hosted.test");
    renderViewModel();

    fireEvent.press(screen.getByTestId("asset-top-up"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        "https://hosted.test/topup?currency=btc",
        PAY_TAB_DEEP_LINK,
      ),
    );
  });

  it("should open the legacy card live app on top up when the legacyTopUp param is on", async () => {
    renderViewModelWithLegacyTopUp();

    fireEvent.press(screen.getByTestId("top-up"));

    await waitFor(() => expect(screen.getByTestId("base-screen")).toHaveTextContent("PlatformApp"));
    expect(screen.getByTestId("base-platform")).toHaveTextContent("cl-card");
    expect(screen.getByTestId("base-name")).toHaveTextContent("CL Card Powered by Ledger");
    expect(mockedOpenSecureBrowser).not.toHaveBeenCalled();
  });

  it("should open the legacy card live app from an asset too, and drop its currency", async () => {
    renderViewModelWithLegacyTopUp();

    fireEvent.press(screen.getByTestId("asset-top-up"));

    await waitFor(() => expect(screen.getByTestId("base-platform")).toHaveTextContent("cl-card"));
    expect(mockedOpenSecureBrowser).not.toHaveBeenCalled();
  });

  it("should open the withdrawal page of the hosted UI for the asset", async () => {
    setEnv("CARD_BAANX_HOSTED_UI", "https://hosted.test");
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    renderViewModel();

    fireEvent.press(screen.getByTestId("asset-withdraw"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        "https://hosted.test/withdrawal?app_id=LEDGERUS&currency=btc",
        PAY_TAB_DEEP_LINK,
      ),
    );
  });

  it("should name the US app on the top up page for a US card holder", async () => {
    setEnv("CARD_BAANX_HOSTED_UI", "https://hosted.test");
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    renderViewModel();

    fireEvent.press(screen.getByTestId("top-up"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        "https://hosted.test/topup?app_id=LEDGERUS",
        PAY_TAB_DEEP_LINK,
      ),
    );
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

  it("should open the card help center article externally", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    renderViewModel();

    fireEvent.press(screen.getByTestId("press-help"));

    expect(openURL).toHaveBeenCalledWith("https://support.ledger.com/article/5283612250653-zd");

    openURL.mockRestore();
  });

  it("should open the manage PIN hosted page in the secure browser", async () => {
    renderViewModel();

    fireEvent.press(screen.getByTestId("press-manage-pin"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        buildHostedUrl(getEnv("CARD_BAANX_HOSTED_UI"), MANAGE_PIN_PATH),
        PAY_TAB_DEEP_LINK,
      ),
    );
  });

  it("should open the access Baanx hosted page in the secure browser", async () => {
    renderViewModel();

    fireEvent.press(screen.getByTestId("press-access-baanx"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        buildHostedUrl(getEnv("CARD_BAANX_HOSTED_UI"), buildAccessBaanxPath(null)),
        PAY_TAB_DEEP_LINK,
      ),
    );
  });

  it("should name the US app on the access Baanx hosted page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    renderViewModel();

    fireEvent.press(screen.getByTestId("press-access-baanx"));

    await waitFor(() =>
      expect(mockedOpenSecureBrowser).toHaveBeenCalledWith(
        buildHostedUrl(getEnv("CARD_BAANX_HOSTED_UI"), buildAccessBaanxPath("LEDGERUS")),
        PAY_TAB_DEEP_LINK,
      ),
    );
  });

  it("should report a warning instead of throwing when the hosted page fails to open", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedOpenSecureBrowser.mockRejectedValueOnce(new Error("could not open browser"));
    renderViewModel();

    fireEvent.press(screen.getByTestId("press-manage-pin"));

    await waitFor(() => expect(warn).toHaveBeenCalledWith("[card] manage pin page did not open"));

    warn.mockRestore();
  });
});
