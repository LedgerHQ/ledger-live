import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import "./globals.css";
import "./live-common-setup";

export const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
