import React from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";

import { store } from "../context/LedgerStore";
import { i18n } from "../context/Locale";

import StyleProvider from "../StyleProvider";

const ProvidersWrapper: React.FC = ({ children }) => {
  return (
    <Provider store={store}>
      <StyleProvider selectedPalette="light">
        <NavigationContainer>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </NavigationContainer>
      </StyleProvider>
    </Provider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) => {
  return render(ui, { wrapper: ProvidersWrapper, ...options });
};

// re-export everything
export * from "@testing-library/react-native";

// override render method
export { customRender as render };
