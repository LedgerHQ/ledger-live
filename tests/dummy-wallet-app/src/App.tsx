import { useState, useEffect, useMemo } from "react";
import { useWalletAPIClient } from "@ledgerhq/wallet-api-client-react";
import { VersionedTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import "./App.css";

export default function App() {
  const { client } = useWalletAPIClient();
  useEffect(() => {
    console.log(client?.custom);
  }, [client?.custom]);

  const [res, setRes] = useState<unknown>();
  const [currencyIds, setCurrencyIds] = useState("");
  const [accountId, setAccountId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [data, setData] = useState("");
  const [message, setMessage] = useState("");
  const [deeplinkUrl, setDeeplinkUrl] = useState("");

  const params = useMemo(
    () => Array.from(new URLSearchParams(window.location.search).entries()),
    [],
  );

  const testLogger = async () => {
    try {
      await client?.custom.logger.log("test");
    } catch (err) {
      setRes(err);
    }
  };

  // Helper to parse currencyIds
  const parsedCurrencyIds = () =>
    currencyIds
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

  const handleAccountRequest = async () => {
    try {
      const ids = parsedCurrencyIds();
      const result =
        ids.length > 0
          ? await client?.account.request({ currencyIds: ids })
          : await client?.account.request();
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleAccountReceive = async () => {
    try {
      const result = await client?.account.receive(accountId);
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleAccountList = async () => {
    try {
      const ids = parsedCurrencyIds();
      const result =
        ids.length > 0
          ? await client?.account.list({ currencyIds: ids })
          : await client?.account.list();
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleBitcoinGetXPub = async () => {
    try {
      const result = await client?.bitcoin.getXPub(accountId);
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleCurrencyList = async () => {
    try {
      const ids = parsedCurrencyIds();
      const result =
        ids.length > 0
          ? await client?.currency.list({ currencyIds: ids })
          : await client?.currency.list();
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleStorage = async () => {
    try {
      // Set a value before getting it
      await client?.storage.set("test-key", "test-value");
      const result = await client?.storage.get("test-key");
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleTransactionSign = async () => {
    try {
      const transaction = {
        family: "ethereum" as const,
        amount: new BigNumber(amount),
        recipient,
        data: Buffer.from(data, "hex"),
      };
      const result = await client?.transaction.sign(accountId, transaction);
      setRes(result?.toString() || "empty response");
    } catch (err) {
      setRes(err);
    }
  };

  const handleTransactionSignSolana = async () => {
    try {
      const transaction = {
        family: "solana" as const,
        amount: new BigNumber(amount),
        recipient,
        model: { kind: "transfer" as const, uiState: {} },
      };
      const result = await client?.transaction.sign(accountId, transaction);
      if (result) {
        const resTransaction = VersionedTransaction.deserialize(result);
        setRes(resTransaction);
      } else {
        setRes("no response");
      }
    } catch (err) {
      setRes(err);
    }
  };

  const handleTransactionSignRawSolana = async () => {
    try {
      const transaction = {
        family: "solana" as const,
        amount: new BigNumber(0),
        recipient: "",
        model: { kind: "transfer" as const, uiState: {} },
        raw: data,
      };
      const result = await client?.transaction.sign(accountId, transaction);
      if (result) {
        const resTransaction = VersionedTransaction.deserialize(result);
        setRes(resTransaction);
      } else {
        setRes("no response");
      }
    } catch (err) {
      setRes(err);
    }
  };

  const handleTransactionSignRaw = async () => {
    try {
      const result = await client?.transaction.signRaw(accountId, data);
      setRes(result || "no response");
    } catch (err) {
      setRes(err);
    }
  };

  const handleTransactionSignAndBroadcast = async () => {
    try {
      const transaction = {
        family: "ethereum" as const,
        amount: new BigNumber(amount),
        recipient,
        data: Buffer.from(data, "hex"),
      };
      const result = await client?.transaction.signAndBroadcast(accountId, transaction);
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleMessageSign = async () => {
    try {
      const messageBuffer = Buffer.from(message, "utf8");
      const result = await client?.message.sign(accountId, messageBuffer);
      setRes(result?.toString() || "empty response");
    } catch (err) {
      setRes(err);
    }
  };

  const handleWalletCapabilities = async () => {
    try {
      const result = await client?.wallet.capabilities();
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleWalletUserId = async () => {
    try {
      const result = await client?.wallet.userId();
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleWalletInfo = async () => {
    try {
      const result = await client?.wallet.info();
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const handleDeeplinkOpen = async () => {
    try {
      const result = await client?.custom.deeplink.open(deeplinkUrl);
      setRes(result);
    } catch (err) {
      setRes(err);
    }
  };

  const clearStates = () => {
    setRes(undefined);
    setCurrencyIds("");
    setAccountId("");
    setRecipient("");
    setAmount("");
    setData("");
    setMessage("");
    setDeeplinkUrl("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <div id="image-container">
          <img src={"ledger-logo.png"} className="app-logo" alt="logo" width={180} height={180} />
          <img src={"dummy-icon.png"} className="dummy" alt="dummy" width={100} height={100} />
        </div>
        <h3>Ledger Live Dummy Wallet API App</h3>
        <p>App for testing the Ledger Live Wallet API manually and in Automated tests</p>
      </header>
      <div className="container">
        <div id="param-container">
          Query Params for web app:
          <ol id="param-list">
            {params.map(([key, value]) => (
              <li key={key}>{`${key}: ${value}`}</li>
            ))}
          </ol>
        </div>
        <div>
          <label htmlFor="account-id-input">Account ID: </label>
          <input
            id="account-id-input"
            data-testid="account-id-input"
            type="text"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            placeholder="e.g. 2d23ca2a-069e-579f-b13d-05bc706c7583"
            className="account-id-input"
          />
        </div>
        <div>
          <label htmlFor="currency-ids-input">Currency IDs (comma separated): </label>
          <input
            id="currency-ids-input"
            data-testid="currency-ids-input"
            type="text"
            value={currencyIds}
            onChange={e => setCurrencyIds(e.target.value)}
            placeholder="e.g. bitcoin,ethereum,solana"
            className="currency-ids-input"
          />
        </div>
        <div>
          <label htmlFor="recipient-input">Recipient: </label>
          <input
            id="recipient-input"
            data-testid="recipient-input"
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="e.g. 0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707"
            className="recipient-input"
          />
        </div>
        <div>
          <label htmlFor="amount-input">Amount (in smallest unit): </label>
          <input
            id="amount-input"
            data-testid="amount-input"
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 100000000000000 (0.0001 ETH in wei)"
            className="amount-input"
          />
        </div>
        <div>
          <label htmlFor="data-input">Data (for Ethereum): </label>
          <input
            id="data-input"
            data-testid="data-input"
            type="text"
            value={data}
            onChange={e => setData(e.target.value)}
            placeholder="e.g. SomeDataInHex"
            className="data-input"
          />
        </div>
        <div>
          <label htmlFor="message-input">Message (for signing): </label>
          <input
            id="message-input"
            data-testid="message-input"
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Hello World"
            className="message-input"
          />
        </div>
        <div>
          <label htmlFor="deeplink-url-input">Deeplink URL: </label>
          <input
            id="deeplink-url-input"
            data-testid="deeplink-url-input"
            type="text"
            value={deeplinkUrl}
            onChange={e => setDeeplinkUrl(e.target.value)}
            placeholder="e.g. ledgerlive://account?currency=bitcoin"
            className="deeplink-url-input"
          />
        </div>
        <div>
          <button onClick={testLogger} data-testid="test-logger">
            Test logger
          </button>
          <button onClick={handleAccountRequest} data-testid="account-request">
            account.request
          </button>
          <button onClick={handleAccountReceive} data-testid="account-receive">
            account.receive
          </button>
          <button onClick={handleAccountList} data-testid="account-list">
            account.list
          </button>
          <button onClick={handleBitcoinGetXPub} data-testid="bitcoin-getXPub">
            bitcoin.getXPub
          </button>
          <button onClick={handleCurrencyList} data-testid="currency-list">
            currency.list
          </button>
          <button onClick={handleStorage} data-testid="storage">
            storage
          </button>
          <button onClick={handleTransactionSign} data-testid="transaction-sign">
            transaction.sign
          </button>
          <button onClick={handleTransactionSignSolana} data-testid="transaction-sign-solana">
            transaction.sign solana
          </button>
          <button
            onClick={handleTransactionSignRawSolana}
            data-testid="transaction-sign-raw-solana"
          >
            transaction.sign raw solana
          </button>
          <button onClick={handleTransactionSignRaw} data-testid="transaction-sign-raw">
            transaction.signRaw
          </button>
          <button
            onClick={handleTransactionSignAndBroadcast}
            data-testid="transaction-signAndBroadcast"
          >
            transaction.signAndBroadcast
          </button>
          <button onClick={handleWalletCapabilities} data-testid="wallet-capabilities">
            wallet.capabilities
          </button>
          <button onClick={handleWalletUserId} data-testid="wallet-userId">
            wallet.userId
          </button>
          <button onClick={handleWalletInfo} data-testid="wallet-info">
            wallet.info
          </button>
          <button onClick={handleMessageSign} data-testid="message-sign">
            message.sign
          </button>
          <button onClick={handleDeeplinkOpen} data-testid="deeplink-open">
            custom.deeplink.open
          </button>
          <button onClick={clearStates} data-testid="clear-states">
            Clear States
          </button>
        </div>
        {res ? <pre data-testid="res-output">{JSON.stringify(res, null, 2)}</pre> : null}
      </div>
    </div>
  );
}
