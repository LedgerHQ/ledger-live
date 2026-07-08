import "./live-common-setup";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { StyleProvider } from "@features/platform-style";
import { AppRoutes } from "./routes";
import { store } from "./store";
import "./globals.css";

export const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <StyleProvider colorScheme="system">
        <AppRoutes />
      </StyleProvider>
    </BrowserRouter>
  </Provider>
);
