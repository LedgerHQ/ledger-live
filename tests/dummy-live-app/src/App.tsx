import React, { useEffect, useRef, useState } from "react";
import LedgerLiveApi, { WindowMessageTransport } from "@ledgerhq/live-app-sdk";
import logo from "./ledger-logo.png";
import "./App.css";

const prettyJSON = (payload: any) => JSON.stringify(payload, null, 2);

const App = () => {
  // Define the Ledger Live API variable used to call api methods
  const api = useRef<LedgerLiveApi>();

  const [output, setOutput] = useState<any>(null);

  // Instantiate the Ledger Live API on component mount
  useEffect(() => {
    const llapi = new LedgerLiveApi(new WindowMessageTransport());
    llapi.connect();
    if (llapi) {
      api.current = llapi;
    }

    // Cleanup the Ledger Live API on component unmount
    return () => {
      api.current = undefined;
      llapi.disconnect();
    };
  }, []);

  const getAccounts = async () => {
    if (!api.current) {
      return;
    }
    const action = await api.current.listAccounts().catch(error => console.error({ error }));
    setOutput(action);
  };

  const requestAccount = async () => {
    if (!api.current) {
      return;
    }
    const action = await api.current.requestAccount().catch(error => console.error({ error }));
    setOutput(action);
  };

  const verifyAddress = async () => {
    if (!api.current) {
      return;
    }
    const action = await api.current.receive("mock:1:bitcoin:true_bitcoin_0:");
    setOutput(action);
  };

  const signBitcoinTransaction = async () => {
    if (!api.current) {
      return;
    }
    const transaction: any = {
      amount: 1230,
      recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
      family: "bitcoin",
      feePerByte: 1,
    };

    const params: any = { useApp: null };

    const action = await api.current.signTransaction(
      "mock:1:bitcoin:true_bitcoin_0:",
      transaction,
      params,
    );
    setOutput(action);
  };

  const signEthereumTransaction = async () => {
    if (!api.current) {
      return;
    }

    const transaction: any = {
      amount: 1230,
      recipient: "0x789d2f10826BF8f3a56Ec524359bBA4e738Af5bF",
      family: "ethereum",
      gasPrice: 10000,
      gasLimit: 200000,
    };

    const params: any = { useApp: null };

    const action = await api.current.signTransaction(
      "mock:1:ethereum:true_ethereum_0:",
      transaction,
      params,
    );
    setOutput(action);
  };

  const broadcastTransaction = async () => {
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
    const action = await api.current.listCurrencies();
    setOutput(action);
  };

  const swap = async () => {
    // not implemented
  };

  const fund = async () => {
    // not implemented
  };

  const sell = async () => {
    // not implemented
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
          <button onClick={verifyAddress} data-test-id="verify-address-button">
            Verify Address
          </button>
          <button onClick={signBitcoinTransaction} data-test-id="sign-bitcoin-transaction-button">
            Sign bitcoin Transaction
          </button>
          <button onClick={signEthereumTransaction} data-test-id="sign-ethereum-transaction-button">
            Sign ethereum Transaction
          </button>
          <button onClick={broadcastTransaction} data-test-id="broadcast-transaction-button">
            Broadcast Transaction (Not yet implemented)
          </button>
          <button onClick={listCurrencies} data-test-id="list-currencies-button">
            List Currencies
          </button>
          <button onClick={swap} data-test-id="swap-button">
            Swap (Not yet implemented)
          </button>
          <button onClick={fund} data-test-id="fund-button">
            Fund (Not yet implemented)
          </button>
          <button onClick={sell} data-test-id="sell-button">
            Sell (Not yet implemented)
          </button>
        </div>
        <pre className="output-container">{output ? prettyJSON(output) : ""}</pre>
      </header>
    </div>
  );
};

export default App;
