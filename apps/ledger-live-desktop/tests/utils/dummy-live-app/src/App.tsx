import LedgerLiveApi, { WindowMessageTransport } from "@ledgerhq/live-app-sdk";
import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, Route, Routes } from "react-router-dom";
import "./App.css";
import logo from "./ledger-logo.png";

const prettyJSON = (payload: any) => JSON.stringify(payload, null, 2);

const Layout = () => {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
      share across all the pages on your site, like navigation. */}
      <nav>
        <ul>
          <li>
            <Link data-test-id="home-link" to="/">
              Home
            </Link>
          </li>
          <li>
            <Link data-test-id="about-link" to="/about">
              About
            </Link>
          </li>
          <li>
            <Link data-test-id="dashboard-link" to="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <Link data-test-id="nothing-here-link" to="/nothing-here">
              Nothing Here
            </Link>
          </li>
        </ul>
      </nav>

      <hr />

      {/* An <Outlet> renders whatever child route is currently active,
      so you can think about this <Outlet> as a placeholder for
      the child routes we defined above. */}
      <Outlet />
    </div>
  );
};

function About() {
  return (
    <div>
      <h2 data-test-id="about-page">About Page</h2>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2 data-test-id="dashboard-page">Dashboard Page</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2 data-test-id="nothing-here-page">Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}

const SDKTests = () => {
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
      void llapi.disconnect();
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

  const signTransaction = async () => {
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

  const broadcastTransaction = async () => {
    if (!api.current) {
    }
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

  const swap = async () => {};

  const fund = async () => {};

  const sell = async () => {};

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
          <button onClick={signTransaction} data-test-id="sign-transaction-button">
            Sign Transaction
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

const App = () => {
  return (
    <div>
      {/* Routes nest inside one another. Nested route paths build upon
          parent route paths, and nested route elements render inside
          parent route elements. See the note about <Outlet> below. */}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SDKTests />} />
          <Route path="about" element={<About />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Using path="*"" means "match anything", so this route
              acts like a catch-all for URLs that we don't have explicit
              routes for. */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
