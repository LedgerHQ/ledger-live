import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { openHostedLoginInSecureBrowser } from "@features/flow-pay-card-auth";
import { readCardUsEnv } from "@features/platform-card";
import { act, render, screen, fireEvent, waitFor } from "@tests/test-renderer";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { ScreenName } from "~/const";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import type { PayTabNavigatorParamList } from "../../types";
import { usePayTabViewModel } from "./usePayTabViewModel";

jest.mock("@features/flow-pay-card-auth", () => ({
  ...jest.requireActual("@features/flow-pay-card-auth"),
  openHostedLoginInSecureBrowser: jest.fn(() => Promise.resolve({ type: "dismissed" })),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  readCardUsEnv: jest.fn(),
}));

const Stack = createNativeStackNavigator<PayTabNavigatorParamList>();

const mockedOpenSecureBrowser = jest.mocked(openHostedLoginInSecureBrowser);
const mockedReadCardUsEnv = jest.mocked(readCardUsEnv);

function PayTabViewModelProbe() {
  const { login, onTopUp } = usePayTabViewModel();
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
});
