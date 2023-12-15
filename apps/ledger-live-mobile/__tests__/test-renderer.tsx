import React from "react";
import { render, RenderOptions, userEvent } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { store } from "~/context/LedgerStore";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import { i18n } from "~/context/Locale";

import StyleProvider from "~/StyleProvider";

const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <StyleProvider selectedPalette="dark">
        <AnalyticsContextProvider>
          <I18nextProvider i18n={i18n}>
            <NavigationContainer>{children}</NavigationContainer>
          </I18nextProvider>
        </AnalyticsContextProvider>
      </StyleProvider>
    </Provider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) => ({
  user: userEvent.setup(),
  ...render(ui, { wrapper: ProvidersWrapper, ...options }),
});

// re-export everything
export * from "@testing-library/react-native";

// override render method
export { customRender as render };
