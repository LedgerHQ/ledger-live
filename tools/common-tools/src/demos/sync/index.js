import "./live-common-setup";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { BigNumber } from "bignumber.js";
import {
  encodeAccountId,
  decodeAccountId,
  shortAddressPreview,
  emptyHistoryCache,
  toAccountRaw,
} from "@ledgerhq/live-common/lib/account";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  formatCurrencyUnit,
} from "@ledgerhq/live-common/lib/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { BridgeSync } from "@ledgerhq/live-common/lib/bridge/react/index";
import { reduce } from "rxjs/operators";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/lib/bridge/cache";
import {
  getDerivationScheme,
  runDerivationScheme,
  asDerivationMode,
} from "@ledgerhq/coin-framework/derivation";

function App() {
  const location = useLocation();
  const history = useHistory();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialWalletSyncAuth = queryParams.get("wallet-sync-auth") || undefined;
  const [walletSyncAuth, setWalletSyncAuth] = useState(initialWalletSyncAuth);

  useEffect(() => {
    if (!walletSyncAuth) return;
    // Update the query parameter whenever the state changes
    queryParams.set("wallet-sync-auth", walletSyncAuth);
    history.replace({ search: queryParams.toString() });
  }, [walletSyncAuth, history, queryParams]);

  const onAddAccount = useCallback(account => {
    setAccounts(accounts => accounts.concat(account));
    setSelectedAccount(account);
  }, []);
  const onRemoveAccount = useCallback(
    accountId => setAccounts(accounts => accounts.filter(a => a.id !== accountId)),
    [],
  );
  const onEditAccount = useCallback(
    (accountId, patch) =>
      setAccounts(accounts => accounts.map(a => (a.id === accountId ? { ...a, ...patch } : a))),
    [],
  );

  const onSelectAccount = useCallback(account => {
    setSelectedAccount(account);
  }, []);

  const onUnselect = useCallback(() => {
    setSelectedAccount(null);
  }, []);

  return (
    <BridgeSyncProvider
      accounts={accounts}
      setAccounts={setAccounts}
      walletSyncAuth={walletSyncAuth}
    >
      <div style={{ margin: "20px auto", maxWidth: 600 }}>
        <WalletSyncAuthForm walletSyncAuth={walletSyncAuth} setWalletSyncAuth={setWalletSyncAuth} />
        <AccountsList
          accounts={accounts}
          onRemoveAccount={onRemoveAccount}
          onEditAccount={onEditAccount}
          onSelectAccount={onSelectAccount}
        />
        <AddAccountForm onAddAccount={onAddAccount} />
        <AccountDetails account={selectedAccount} onUnselect={onUnselect} />
      </div>
    </BridgeSyncProvider>
  );
}

const localCache = {};
const bridgeCache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },

  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

function inferAccount(id) {
  const { derivationMode, xpubOrAddress, currencyId } = decodeAccountId(id);
  const currency = getCryptoCurrencyById(currencyId);
  const scheme = getDerivationScheme({
    derivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });
  const account = {
    type: "Account",
    name: `${currency.name} ${derivationMode || "legacy"} ${shortAddressPreview(xpubOrAddress)}`,
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    starred: true,
    used: true,
    swapHistory: [],
    id,
    derivationMode,
    currency,
    unit: currency.units[0],
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    freshAddresses: [],
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
  return account;
}

async function syncAccount(id) {
  const account = inferAccount(id);
  const bridge = getAccountBridge(account);
  await bridgeCache.prepareCurrency(account.currency);
  const syncConfig = {
    paginationConfig: {},
    blacklistedTokenIds: [],
  };
  const observable = bridge.sync(account, syncConfig);
  const reduced = observable.pipe(reduce((a, f) => f(a), account));
  const synced = await reduced.toPromise();
  return synced;
}

function BridgeSyncProvider({ children, accounts, setAccounts, walletSyncAuth }) {
  const track = useCallback(() => {}, []);
  const updateAccount = useCallback(
    (accountId, updater) =>
      setAccounts(accounts => accounts.map(a => (a.id === accountId ? updater(a) : a))),
    [setAccounts],
  );

  const updateAllAccounts = setAccounts;

  const recoverError = useCallback(error => error, []);

  const versionRef = useRef(0);
  const getVersion = useCallback(() => versionRef.current, []);

  const latestWalletSyncRef = useRef([]);
  const getLatestWalletSyncPayload = useCallback(() => latestWalletSyncRef.current, []);

  const onVersionUpdate = useCallback(version => {
    versionRef.current = version;
  }, []);

  const walletSyncVersionManager = useMemo(
    () => ({ onVersionUpdate, getVersion }),
    [onVersionUpdate, getVersion],
  );

  const setLatestWalletSyncPayload = useCallback(descriptors => {
    latestWalletSyncRef.current = descriptors;
  }, []);

  return (
    <BridgeSync
      accounts={accounts}
      updateAccountWithUpdater={updateAccount}
      updateAllAccounts={updateAllAccounts}
      recoverError={recoverError}
      trackAnalytics={track}
      prepareCurrency={bridgeCache.prepareCurrency}
      hydrateCurrency={bridgeCache.hydrateCurrency}
      blacklistedTokenIds={undefined}
      walletSyncAuth={walletSyncAuth}
      walletSyncVersionManager={walletSyncVersionManager}
      setLatestWalletSyncPayload={setLatestWalletSyncPayload}
      getLatestWalletSyncPayload={getLatestWalletSyncPayload}
    >
      {children}
    </BridgeSync>
  );
}

function AccountDetails({ account, onUnselect }) {
  if (!account) return null;
  return (
    <div>
      <h2>
        {"Account details "}
        <button onClick={onUnselect}>{"X"}</button>
      </h2>
      <pre>
        <code>{JSON.stringify(toAccountRaw(account), null, 2)}</code>
      </pre>
    </div>
  );
}

function AccountsList({ accounts, onRemoveAccount, onEditAccount, onSelectAccount }) {
  return (
    <div>
      <h2>Accounts</h2>
      {accounts.length === 0 ? <p>nothing yet</p> : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {accounts.map(account => (
          <li
            key={account.id}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              style={{ border: "none", background: "none" }}
              onClick={() => {
                console.log(account);
                onSelectAccount(account);
              }}
            >
              {"🔎"}
            </button>

            <input
              value={account.name}
              onChange={e => {
                onEditAccount(account.id, { name: e.target.value });
              }}
              style={{ width: 100 }}
            />

            <strong style={{ display: "inline-block", minWidth: 100 }}>
              {formatCurrencyUnit(account.unit, account.balance, {
                showCode: true,
              })}
            </strong>

            <input
              value={account.id}
              style={{ background: "none", border: "none", color: "#666" }}
              onClick={e => e.target.select()}
            />

            <button onClick={() => onRemoveAccount(account.id)}>{"❌"}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WalletSyncAuthForm({ walletSyncAuth, setWalletSyncAuth }) {
  return (
    <div>
      <h2>Set Wallet Sync Auth</h2>
      <input
        type="text"
        placeholder="wallet sync auth"
        name="walletSyncAuth"
        value={walletSyncAuth}
        onChange={e => setWalletSyncAuth(e.target.value)}
      />
      <button
        onClick={() =>
          setWalletSyncAuth(
            [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(""),
          )
        }
      >
        RANDOMIZE
      </button>
    </div>
  );
}

function AddAccountForm({ onAddAccount }) {
  // synchronise account with an id that is input in a input text field
  const [accountId, setAccountId] = useState("");
  const [accountIdError, setAccountIdError] = useState("");

  const [account, setAccount] = useState(null);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    // if we have an accountId, we try to infer it
    if (accountId) {
      try {
        setAccountId(inferAccountId(accountId));
        setAccountIdError("");
      } catch (e) {
        setAccountIdError(e.message);
      }
    }
  }, [accountId]);

  let onSubmit = useCallback(
    e => {
      e.preventDefault();
      // if we have an accountId, we try to synchronise it
      if (accountId) {
        try {
          decodeAccountId(accountId);
          setAccountError("");
          setAccount(undefined);
          syncAccount(accountId).then(setAccount, setAccountError);
        } catch (e) {
          setAccount(null);
          console.error(e);
        }
      }
    },
    [accountId],
  );

  useEffect(() => {
    if (account) {
      onAddAccount(account);
    }
  }, [account, onAddAccount]);

  return (
    <form onSubmit={onSubmit}>
      <h2>Add account by its identifier</h2>
      <input
        type="text"
        name="accountId"
        placeholder="account id"
        value={accountId}
        onChange={e => setAccountId(e.target.value)}
      />
      <span style={{ color: "red" }}>{accountIdError}</span>
      <button type="submit" disabled={!accountId || account === undefined}>
        ADD
      </button>
      <pre>
        <code>
          {account
            ? "synchronised!"
            : accountError
            ? String(accountError)
            : account === null
            ? "insert an account id to synchronise"
            : "loading..."}
        </code>
      </pre>
    </form>
  );
}

App.demo = {
  title: "Sync",
  url: "/sync",
};

function inferAccountId(id) {
  try {
    // preserve if decodeAccountId don't fail
    decodeAccountId(id);
    return id;
  } catch (e) {
    const splitted = id.split(":");

    const findAndEat = predicate => {
      const res = splitted.find(predicate);

      if (typeof res === "string") {
        splitted.splice(splitted.indexOf(res), 1);
        return res;
      }
    };

    const currencyId = findAndEat(s => findCryptoCurrencyById(s));
    if (!currencyId) {
      throw new Error("invalid id='" + id + "': missing currency part");
    }
    const type = "js";
    const version = findAndEat(s => s.match(/^\d+$/)) || "1";
    const derivationMode = asDerivationMode(
      findAndEat(s => {
        try {
          return asDerivationMode(s);
        } catch (e) {
          // this is therefore not a derivation mode
        }
      }) ?? "",
    );

    if (splitted.length === 0) {
      throw new Error("invalid id='" + id + "': missing xpub or address part");
    }

    if (splitted.length > 1) {
      throw new Error(
        "invalid id='" +
          id +
          "': couldn't understand which of these are the xpub or address part: " +
          splitted.join(" | "),
      );
    }

    const xpubOrAddress = splitted[0];
    return encodeAccountId({
      type,
      version,
      currencyId,
      xpubOrAddress,
      derivationMode,
    });
  }
}

export default App;
