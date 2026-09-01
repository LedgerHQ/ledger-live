import "./live-common-setup";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { StyleProvider } from "@features/platform-style";
import { AccountDataProvider } from "@features/platform-account-data/react";
import { AppRoutes } from "./routes";
import { store } from "./store";
import { accountDataScheduler } from "./logic/accountData";
import "./globals.css";

export const App = () => (
  <Provider store={store}>
    <AccountDataProvider scheduler={accountDataScheduler}>
      <BrowserRouter>
        <StyleProvider colorScheme="system">
          <AppRoutes />
        </StyleProvider>
      </BrowserRouter>
    </AccountDataProvider>
  </Provider>
);
