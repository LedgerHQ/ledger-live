import React, { useEffect, useRef, useState } from "react";
import HWTransport from "@ledgerhq/hw-transport";
import Eth from "@ledgerhq/hw-app-eth";
import hwGetDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import {
  Transaction,
  TransactionSign,
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer";
import logo from "./ledger-logo.png";
import "./App.css";

global.Buffer = Buffer;

const prettyJSON = (payload: any) => JSON.stringify(payload, null, 2);

const App = () => {
  // Define the Ledger Live API variable used to call api methods
  const api = useRef<WalletAPIClient>();
  const transport = useRef<HWTransport>();

  const [output, setOutput] = useState<any>(null);

  // Instantiate the Ledger Live API on component mount
  useEffect(() => {
    const windowTransport = new WindowMessageTransport();
    const client = new WalletAPIClient(windowTransport);
    windowTransport.connect();
    api.current = client;

    // Cleanup the Ledger Live API on component unmount
    return () => {
      api.current = undefined;
      windowTransport.disconnect();
    };
  }, []);

  const getAccounts = async () => {
    if (!api.current) {
      return;
    }
    try {
      const action = await api.current.listAccounts({ currencyIds: ["bitcoin", "ethereum"] });
      setOutput(action);
    } catch (error) {
      console.error(error);
    }
  };

  const requestAccount = async () => {
    if (!api.current) {
      return;
    }
    try {
      const action = await api.current.requestAccount({ currencyIds: ["bitcoin", "ethereum"] });
      setOutput(action);
    } catch (error) {
      console.error(error);
    }
  };

  const signTransaction = async () => {
    if (!api.current) {
      return;
    }
    const transaction: Transaction = {
      amount: new BigNumber(1230),
      recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
      family: "bitcoin",
      feePerByte: new BigNumber(1),
    };

    const params: TransactionSign["params"]["options"] = { hwAppId: undefined };

    const action = await api.current.signTransaction(
      "mock:1:bitcoin:true_bitcoin_0:",
      transaction,
      params,
    );
    setOutput(action.toString());
  };

  const signAndBroadcastTransaction = async () => {
    // if (!api.current) {
    //   return;
    // }
    // const action = await api.current.broadcastSignedTransaction("mock:1:bitcoin:true_bitcoin_0:", signed tx);
    // setOutput(action)
  };

  const listCurrencies = async () => {
    if (!api.current) {
      return;
    }
    try {
      const action = await api.current.listCurrencies({ currencyIds: ["bitcoin", "ethereum"] });
      setOutput(action);
    } catch (error) {
      console.error(error);
    }
  };

  const getTransport = (appName?: string) => async () => {
    if (!api.current) {
      return;
    }
    try {
      transport.current = await api.current.deviceTransport({ appName });
    } catch (error) {
      console.error(error);
    }
  };

  const getDeviceInfo = async () => {
    if (!transport.current) {
      return;
    }
    try {
      const res = await hwGetDeviceInfo(transport.current);
      setOutput(res);
    } catch (error) {
      console.error(error);
    }
  };

  const ethGetAppConfiguration = async () => {
    if (!transport.current) {
      return;
    }
    try {
      const eth = new Eth(transport.current);
      const res = await eth.getAppConfiguration();
      setOutput(res);
    } catch (error) {
      console.error(error);
    }
  };

  const closeTransport = () => {
    transport.current?.close();
    transport.current = undefined;
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3>Ledger Live Dummy Test App</h3>
        <p>App for testing the Ledger Live SDK manually and in Automated tests</p>
        <div className="button-container">
          <button onClick={getAccounts} data-test-id="get-all-accounts-button">
            Get all accounts
          </button>
          <button onClick={requestAccount} data-test-id="request-single-account-button">
            Request account
          </button>
          <button onClick={signTransaction} data-test-id="sign-transaction-button">
            Sign Transaction
          </button>
          <button
            onClick={signAndBroadcastTransaction}
            data-test-id="sign-broadcast-transaction-button"
          >
            Broadcast Transaction (Not yet implemented)
          </button>
          <button onClick={listCurrencies} data-test-id="list-currencies-button">
            List Currencies
          </button>
          <button onClick={getTransport()} data-test-id="get-bolos-transport-button">
            getBolosTransport
          </button>
          <button onClick={getDeviceInfo} data-test-id="get-device-info-button">
            getDeviceInfo
          </button>
          <button onClick={getTransport("Ethereum")} data-test-id="get-eth-transport-button">
            getEthTransport
          </button>
          <button onClick={ethGetAppConfiguration} data-test-id="eth-get-app-configuration-button">
            ethGetAppConfiguration
          </button>
          <button onClick={closeTransport} data-test-id="get-eth-transport-button">
            closeTransport
          </button>
        </div>
        <pre className="output-container">{output ? prettyJSON(output) : ""}</pre>
      </header>
    </div>
  );
};

export default App;
