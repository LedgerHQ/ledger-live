import React, { PropsWithChildren } from "react";
import ReactDOM from "react-dom";
import { CustomLogger } from "@ledgerhq/live-common/wallet-api/CustomLogger/client";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import { Transport, WalletAPIClient, WindowMessageTransport } from "@ledgerhq/wallet-api-client";
import "./index.css";
import App from "./App";

function getCustomModule(client: WalletAPIClient) {
  return new CustomLogger(client);
  // We need to improve the types to make this work better
  // return {
  //   logger: new CustomLogger(client),
  // };
}

function TransportProvider({ children }: PropsWithChildren<object>) {
  function getWalletAPITransport(): Transport {
    if (typeof window === "undefined") {
      return {
        onMessage: undefined,
        send: () => {},
      };
    }

    const transport = new WindowMessageTransport();
    transport.connect();
    return transport;
  }

  const transport = getWalletAPITransport();

  return (
    <WalletAPIProvider transport={transport} getCustomModule={getCustomModule}>
      {children}
    </WalletAPIProvider>
  );
}

ReactDOM.render(
  <TransportProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </TransportProvider>,
  document.getElementById("root"),
);
