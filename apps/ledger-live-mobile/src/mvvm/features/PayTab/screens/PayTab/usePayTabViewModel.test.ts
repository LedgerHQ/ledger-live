import { createElement, type ReactNode } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, renderHook } from "@tests/test-renderer";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { ScreenName } from "~/const";
import { PAY_TAB_DEEP_LINK } from "~/navigation/deeplinks/payTabDeepLink";
import type { PayTabNavigatorParamList } from "../../types";
import { usePayTabViewModel } from "./usePayTabViewModel";

const Stack = createNativeStackNavigator<PayTabNavigatorParamList>();

function withPayTabRoute(params?: PayTabNavigatorParamList[typeof ScreenName.PayTab]) {
  return function PayTabRoute({ children }: { children?: ReactNode }) {
    function PayTabScreen() {
      return children ?? null;
    }

    return createElement(
      Stack.Navigator,
      { screenOptions: { headerShown: false } },
      createElement(Stack.Screen, {
        name: ScreenName.PayTab,
        initialParams: params,
        component: PayTabScreen,
      }),
    );
  };
}

function renderViewModel(params?: PayTabNavigatorParamList[typeof ScreenName.PayTab]) {
  return renderHook(() => usePayTabViewModel(), {
    innerWrapper: withPayTabRoute(params),
  });
}

describe("usePayTabViewModel", () => {
  afterEach(() => {
    setEnv("CARD_API_URL", getEnvDefault("CARD_API_URL"));
    setEnv("CARD_BAANX_CLIENT_KEY", getEnvDefault("CARD_BAANX_CLIENT_KEY"));
  });

  it("should expose the OAuth client configuration", () => {
    const { result } = renderViewModel();

    expect(result.current.oauthConfig).toEqual({
      apiUrl: getEnv("CARD_API_URL"),
      clientId: getEnv("CARD_BAANX_CLIENT_KEY"),
      redirectUri: getEnv("CARD_OAUTH_REDIRECT_URI"),
      deepLink: PAY_TAB_DEEP_LINK,
    });
  });

  it("should follow a change of the Card env vars", () => {
    const { result } = renderViewModel();

    act(() => {
      setEnv("CARD_API_URL", "https://card.staging.test");
      setEnv("CARD_BAANX_CLIENT_KEY", "staging-client-key");
    });

    expect(result.current.oauthConfig).toEqual({
      apiUrl: "https://card.staging.test",
      clientId: "staging-client-key",
      redirectUri: getEnv("CARD_OAUTH_REDIRECT_URI"),
      deepLink: PAY_TAB_DEEP_LINK,
    });
  });

  it("should hand the login flow the redirect the deep link carried", () => {
    const { result } = renderViewModel({ code: "auth-code" });

    expect(result.current.callback).toEqual({ code: "auth-code" });
  });

  it.each([
    ["there are no params", undefined],
    ["the code is missing", {}],
  ])("should report no redirect when %s", (_case, params) => {
    const { result } = renderViewModel(params);

    expect(result.current.callback).toBeNull();
  });
});
