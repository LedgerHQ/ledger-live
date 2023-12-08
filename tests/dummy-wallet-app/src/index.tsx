import React, { PropsWithChildren, useMemo } from "react";
import ReactDOM from "react-dom";
import { CustomLogger } from "@ledgerhq/live-common/wallet-api/CustomLogger/client";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import {
  EventHandlers,
  Transport,
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";
import "./index.css";
import App from "./App";

// Register things for type safety
declare module "@ledgerhq/wallet-api-client-react" {
  interface Register {
    client: WalletAPIClient<typeof getCustomModule>;
  }
}

function getCustomModule(client: WalletAPIClient) {
  return new CustomLogger(client);
  // You can also return an object with many modules
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

  const eventHandlers = useMemo<EventHandlers>(() => {
    return {
      "event.custom.test": param => {
        console.log("event handler param:", param);
      },
    };
  }, []);

  const transport = getWalletAPITransport();

  return (
    <WalletAPIProvider
      transport={transport}
      getCustomModule={getCustomModule}
      eventHandlers={eventHandlers}
    >
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
