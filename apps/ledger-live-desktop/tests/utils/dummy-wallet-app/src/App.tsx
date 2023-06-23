import React, { useCallback, useEffect, useRef } from "react";
import { WindowMessageTransport, RpcResponse } from "@ledgerhq/wallet-api-client";
import "./App.css";

type PendingRequests = Record<string, (response: RpcResponse) => void>;

function useE2EInjection() {
  const queue = useRef<PendingRequests>({});
  const transport = useRef(new WindowMessageTransport());

  const send = useCallback(jsonStr => {
    const { id } = JSON.parse(jsonStr);

    return new Promise(resolve => {
      queue.current[id] = resolve;
      transport.current.send(jsonStr);
    });
  }, []);

  useEffect(() => {
    transport.current.connect();
    transport.current.onMessage = (msgStr: string) => {
      const msg = JSON.parse(msgStr);
      if (!msg.id) return;

      const resolve = queue.current[msg.id];
      if (!resolve) return;

      resolve(msg);
      delete queue.current[msg.id];
    };

    window.ledger = {
      // to avoid overriding other fields
      ...window.ledger,
      e2e: {
        ...window.ledger?.e2e,
        walletApi: {
          send,
        },
      },
    };
  }, [send]);
}

function getQueryParams(params: URLSearchParams) {
  const paramList = [];

  for (const [key, value] of params.entries()) {
    paramList.push(<li>{`${key}: ${value}`}</li>);
  }

  return paramList;
}

const App = () => {
  useE2EInjection();

  const searchParams = new URLSearchParams(window.location.search);

  return (
    <div className="App">
      <header className="App-header">
        <div id="image-container">
          <img src={"ledger-logo.png"} className="app-logo" alt="logo" width={180} height={180} />
          <img src={"dummy-icon.png"} className="dummy" alt="dummy" width={100} height={100} />
        </div>
        <h3>Ledger Live Dummy Wallet API App</h3>
        <p>App for testing the Ledger Live Wallet API manually and in Automated tests</p>
        <div id="param-container">
          Query Params for web app:
          <ol id="param-list">{searchParams && getQueryParams(searchParams)}</ol>
        </div>
      </header>
    </div>
  );
};

export default App;
