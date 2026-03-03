import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { TransportProvider } from "./TransportProvider";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <TransportProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </TransportProvider>,
);
