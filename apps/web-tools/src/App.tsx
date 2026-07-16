import "./live-common-setup";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { AppRoutes } from "./routes";
import { store } from "./store";
import "./globals.css";

export const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </Provider>
);
