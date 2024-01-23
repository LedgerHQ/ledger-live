import React, { useState, useEffect, useMemo } from "react";
import { useE2EInjection } from "./hooks";
import "./App.css";
import { useWalletAPIClient } from "@ledgerhq/wallet-api-client-react";

export default function App() {
  useE2EInjection();
  const { client } = useWalletAPIClient();
  useEffect(() => {
    console.log(client?.custom);
  });

  const [res, setRes] = useState<unknown>();

  const testLogger = async () => {
    try {
      await client?.custom.log("test");
    } catch (err) {
      setRes(err);
    }
  };

  const params = useMemo(
    () => Array.from(new URLSearchParams(window.location.search).entries()),
    [],
  );

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
          <ol id="param-list">
            {params.map(([key, value]) => (
              <li key={key}>{`${key}: ${value}`}</li>
            ))}
          </ol>
        </div>
        <button onClick={testLogger}>Test logger</button>
        {res ? <pre>{JSON.stringify(res, null, 2)}</pre> : null}
      </header>
    </div>
  );
}
