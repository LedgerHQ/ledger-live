import "./live-common-setup";
import React, { useEffect, useState } from "react";
import { BigNumber } from "bignumber.js";
import {
  encodeAccountId,
  decodeAccountId,
  shortAddressPreview,
  emptyHistoryCache,
} from "@ledgerhq/live-common/lib/account";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/lib/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { reduce } from "rxjs/operators";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/lib/bridge/cache";
import {
  getDerivationScheme,
  runDerivationScheme,
  asDerivationMode,
} from "@ledgerhq/coin-framework/derivation";

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
    name:
      currency.name +
      " " +
      (derivationMode || "legacy") +
      " " +
      shortAddressPreview(xpubOrAddress),
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

function App() {
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

  useEffect(() => {
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
  }, [accountId]);

  return (
    <div>
      <h1>Synchronisation</h1>
      <p>
        <input
          type="text"
          placeholder="account id"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        />
        <span style={{ color: "red" }}>{accountIdError}</span>
      </p>
      <pre>
        <code>
          {account
            ? JSON.stringify(account, null, 2)
            : accountError
            ? String(accountError)
            : account === null
            ? "insert an account id to synchronise"
            : "loading..."}
        </code>
      </pre>
    </div>
  );
}

App.demo = {
  title: "Synchronisation",
  url: "/sync",
};

function inferAccountId(id) {
  try {
    // preserve if decodeAccountId don't fail
    decodeAccountId(id);
    return id;
  } catch (e) {
    const splitted = id.split(":");

    const findAndEat = (predicate) => {
      const res = splitted.find(predicate);

      if (typeof res === "string") {
        splitted.splice(splitted.indexOf(res), 1);
        return res;
      }
    };

    const currencyId = findAndEat((s) => findCryptoCurrencyById(s));
    if (!currencyId) {
      throw new Error("invalid id='" + id + "': missing currency part");
    }
    const type = "js";
    const version = findAndEat((s) => s.match(/^\d+$/)) || "1";
    const derivationMode = asDerivationMode(
      findAndEat((s) => {
        try {
          return asDerivationMode(s);
        } catch (e) {
          // this is therefore not a derivation mode
        }
      }) ?? ""
    );

    if (splitted.length === 0) {
      throw new Error("invalid id='" + id + "': missing xpub or address part");
    }

    if (splitted.length > 1) {
      throw new Error(
        "invalid id='" +
          id +
          "': couldn't understand which of these are the xpub or address part: " +
          splitted.join(" | ")
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
