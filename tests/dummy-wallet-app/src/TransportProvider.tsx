import { PropsWithChildren, useMemo } from "react";
import { CustomLogger } from "@ledgerhq/live-common/wallet-api/CustomLogger/client";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import {
  EventHandlers,
  Transport,
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";

// Register things for type safety
declare module "@ledgerhq/wallet-api-client-react" {
  interface Register {
    client: WalletAPIClient<typeof getCustomModule>;
  }
}

function getCustomModule(client: WalletAPIClient) {
  return new CustomLogger(client);
  // We need to improve the types to make this work better
  // return {
  //   logger: new CustomLogger(client),
  // };
}

export function TransportProvider({ children }: PropsWithChildren<object>) {
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
