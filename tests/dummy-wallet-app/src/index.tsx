import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { TransportProvider } from "./TransportProvider";

ReactDOM.render(
  <TransportProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </TransportProvider>,
  document.getElementById("root"),
);
