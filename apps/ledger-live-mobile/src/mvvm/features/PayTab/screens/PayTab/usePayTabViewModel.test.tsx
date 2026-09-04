import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, render, screen } from "@tests/test-renderer";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { ScreenName } from "~/const";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import type { PayTabNavigatorParamList } from "../../types";
import { usePayTabViewModel } from "./usePayTabViewModel";

const Stack = createNativeStackNavigator<PayTabNavigatorParamList>();

function PayTabViewModelProbe() {
  const { oauthConfig, callback } = usePayTabViewModel();

  return (
    <>
      <Text testID="oauth-api-url">{oauthConfig.apiUrl}</Text>
      <Text testID="oauth-client-id">{oauthConfig.clientId}</Text>
      <Text testID="oauth-hosted-ui">{oauthConfig.hostedUiUrl}</Text>
      <Text testID="oauth-redirect">{oauthConfig.redirectUri}</Text>
      <Text testID="oauth-deeplink">{oauthConfig.deepLink}</Text>
      <Text testID="oauth-callback">{JSON.stringify(callback)}</Text>
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
  afterEach(() => {
    setEnv("CARD_API_URL", getEnvDefault("CARD_API_URL"));
    setEnv("CARD_BAANX_CLIENT_KEY", getEnvDefault("CARD_BAANX_CLIENT_KEY"));
    setEnv("CARD_BAANX_HOSTED_UI", getEnvDefault("CARD_BAANX_HOSTED_UI"));
  });

  it("should expose the OAuth client configuration", () => {
    renderViewModel();

    expect(screen.getByTestId("oauth-api-url")).toHaveTextContent(getEnv("CARD_API_URL"));
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
      setEnv("CARD_API_URL", "https://card.staging.test");
      setEnv("CARD_BAANX_CLIENT_KEY", "staging-client-key");
      setEnv("CARD_BAANX_HOSTED_UI", "https://hosted.staging.test");
    });

    expect(screen.getByTestId("oauth-api-url")).toHaveTextContent("https://card.staging.test");
    expect(screen.getByTestId("oauth-client-id")).toHaveTextContent("staging-client-key");
    expect(screen.getByTestId("oauth-hosted-ui")).toHaveTextContent("https://hosted.staging.test");
  });

  it("should hand the login flow the redirect the deep link carried", () => {
    renderViewModel({ code: "auth-code" });

    expect(screen.getByTestId("oauth-callback")).toHaveTextContent(
      JSON.stringify({ code: "auth-code" }),
    );
  });

  it.each([
    ["there are no params", undefined],
    ["the code is missing", {}],
  ])("should report no redirect when %s", (_case, params) => {
    renderViewModel(params);

    expect(screen.getByTestId("oauth-callback")).toHaveTextContent("null");
  });
});
