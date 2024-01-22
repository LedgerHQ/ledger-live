import React from "react";
import { render, RenderOptions, userEvent } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { getFeature } from "./featureFlags";
import { i18n } from "~/context/Locale";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import StyleProvider from "~/StyleProvider";

type ExtraOptions = RenderOptions & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialState?: any;
  featureFlags?: { [key: string]: unknown };
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
};

const customRender = (
  ui: React.ReactElement,
  {
    initialState = {},
    userEventOptions = {},
    featureFlags = {},
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    preloadedState: {
      ...initialState,
      settings: {
        ...SETTINGS_INITIAL_STATE,
        ...(initialState.settings || {}),
        overriddenFeatureFlags: featureFlags,
      },
    },
    devTools: false,
  });

  const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <Provider store={store}>
        <StyleProvider selectedPalette="dark">
          <FirebaseFeatureFlagsProvider getFeature={getFeature}>
            <AnalyticsContextProvider>
              <I18nextProvider i18n={i18n}>
                <NotificationsProvider>
                  <NavigationContainer>{children}</NavigationContainer>
                </NotificationsProvider>
              </I18nextProvider>
            </AnalyticsContextProvider>
          </FirebaseFeatureFlagsProvider>
        </StyleProvider>
      </Provider>
    );
  };

  return {
    user: userEvent.setup(userEventOptions),
    ...render(ui, { wrapper: ProvidersWrapper, ...renderOptions }),
  };
};

// re-export everything
export * from "@testing-library/react-native";

// override render method
export { customRender as render };
