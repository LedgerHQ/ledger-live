"use client";
import "./live-common-setup";

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearAccount,
  fromAccountRaw,
  getAccountName,
  toAccountRaw,
} from "@ledgerhq/live-common/account/index";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  isCurrencySupported,
  listSupportedCurrencies,
  sanitizeValueString,
} from "@ledgerhq/live-common/currencies/index";
import { getAssetsDistribution } from "@ledgerhq/live-countervalues/portfolio";
import {
  Countervalues,
  useCountervaluesState,
  useTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues-react";
import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { reduce } from "rxjs/operators";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { Account } from "@ledgerhq/types-live";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-common/promise";
import { Observable, lastValueFrom } from "rxjs";
import BigNumber from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

// TODO these could be a state
const deviceId = "webhid";
const countervalue = getFiatCurrencyByTicker("EUR");
const locale = "en";

function App() {
  // for now, we consider the most basic state management using react states and callbacks
  const [accounts, setAccounts] = useState<Account[]>([]);

  useLocalStorage(accounts, setAccounts);

  return (
    <div style={{ margin: "40px auto", width: 800 }}>
      <style>{`
        /* dirty inlined CSS */
        label {
          display: block;
          margin-bottom: 10px;
        }
      `}</style>
      <h2>Add Accounts With a device</h2>
      <HeadlessAddAccounts setAccounts={setAccounts} />
      <h2>Show the accounts</h2>
      <HeadlessShowAccounts accounts={accounts} setAccounts={setAccounts} />
      <h2>Show the portfolio value</h2>
      <HeadlessShowPortfolio accounts={accounts} countervalue={countervalue} />
      <h2>State management</h2>
      <HeadlessStateManagement accounts={accounts} setAccounts={setAccounts} />
      <h2>Send a transaction</h2>
      <HeadlessSendFlow accounts={accounts} />
    </div>
  );
}

// This is the part that handles adding accounts with a device
// at the moment, when user client "Add accounts" we directly assume the device is connected and already on the correct app
// in future, we can explore automation on automatically detecting the device, app and triggering the appropriate open app action to do so
// this is what the component <DeviceAction> offers in ledger-live-desktop , but we went minimalistic here. In future, device-sdk should have this in scope.
function HeadlessAddAccounts({
  setAccounts,
}: {
  setAccounts: (_: (_: Account[]) => Account[]) => void;
}) {
  // merge accounts with the existing ones
  const addAccounts = useCallback(
    (accounts: Account[]) => {
      setAccounts(state => {
        const existingSet = new Set(state.map(a => a.id));
        return state.concat(accounts.filter(a => !existingSet.has(a.id)));
      });
    },
    [setAccounts],
  );

  const [disabled, setDisabled] = useState(false);

  const onSubmit = useCallback(
    (e: any) => {
      e.preventDefault();
      if (!e.target) return;
      const data = new FormData(e.target);
      const currencyId = data.get("currency");
      if (!currencyId) return;
      setDisabled(true);
      // This is how we scan for accounts with the bridge today
      const currency = getCryptoCurrencyById(String(currencyId));
      const currencyBridge = getCurrencyBridge(currency);
      const sub = appForCurrency(deviceId, currency, () =>
        currencyBridge.scanAccounts({
          currency,
          deviceId,
          syncConfig: {
            paginationConfig: {},
            blacklistedTokenIds: [],
          },
        }),
      ).subscribe({
        next: event => {
          if (event.type === "discovered") {
            addAccounts([event.account]);
          }
        },
        complete: () => {
          setDisabled(false);
        },
        error: error => {
          console.error(error);
          setDisabled(false);
        },
      });
      // TODO we could also offer an interruptability by doing sub.unsubscribe() when the user wants to cancel
      return () => {
        sub.unsubscribe();
      };
    },
    [addAccounts],
  );
  return (
    <div>
      <form onSubmit={onSubmit}>
        <label htmlFor="currency">
          <span>Currency</span>
          <select name="currency" id="currency">
            <option value="">Select a currency</option>
            {listSupportedCurrencies().map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={disabled}>
          Add accounts
        </button>
      </form>
    </div>
  );
}

// This is the part that just show the accounts as they are.
// there is just an action to delete on each action, convenient as i've made the previous add accounts to directly append into the list
// we may totally change this state management paradigm if we want
function HeadlessShowAccounts({
  accounts,
  setAccounts,
}: {
  accounts: Account[];
  setAccounts: (_: (_: Account[]) => Account[]) => void;
}) {
  const removeAccount = useCallback(
    (accountId: string) => {
      setAccounts(state => state.filter(a => a.id !== accountId));
    },
    [setAccounts],
  );

  if (accounts.length === 0) {
    return <div>No accounts.</div>;
  }
  return (
    <div>
      <ul>
        {accounts.map(account => (
          <li
            key={account.id}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <strong>{getAccountName(account)}</strong>
            <code>{account.freshAddress}</code>
            <span>{formatCurrencyUnit(account.unit, account.balance, { showCode: true })}</span>
            <span>
              <button type="button" onClick={() => removeAccount(account.id)}>
                {" "}
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// For thie portfolio, we need the countervalues to be loaded, so we first need the tracking pairs to be in sync with the accounts
// then we can use the countervalues to compute the portfolio
// Note that it's totally possible to lift up the context to the parent component. depending on our needs again.
function HeadlessShowPortfolio({
  accounts,
  countervalue,
}: {
  accounts: Account[];
  countervalue: Currency;
}) {
  const trackingPairs = useTrackingPairForAccounts(accounts, countervalue);
  const userSettings = useMemo(() => ({ trackingPairs, autofillGaps: true }), [trackingPairs]);
  return (
    <Countervalues userSettings={userSettings}>
      <HeadlessShowPortfolioInner accounts={accounts} countervalue={countervalue} />
    </Countervalues>
  );
}

function HeadlessShowPortfolioInner({
  accounts,
  countervalue,
}: {
  accounts: Account[];
  countervalue: Currency;
}) {
  const cvState = useCountervaluesState();
  const assets = getAssetsDistribution(accounts, cvState, countervalue);

  if (accounts.length === 0) {
    return <div>No accounts.</div>;
  }
  console.log(assets); // so here, we should have all the data we need
  return (
    <div>
      Portfolio balance:{" "}
      {formatCurrencyUnit(countervalue.units[0], BigNumber(assets.sum), { showCode: true })}
    </div>
  );
}

// to simplify a bit everything, there is no automatic "account sync" that happens
// so we offer a button to do it manually for ALL accounts at the moment
// it's not the best idea, but it works.
// there is also a feature to import an existing app.json and it's very handy.
function HeadlessStateManagement({
  accounts,
  setAccounts,
}: {
  accounts: Account[];
  setAccounts: (_: (_: Account[]) => Account[]) => void;
}) {
  const syncAllAccounts = useSyncAllAccounts(accounts, setAccounts);
  const [synchronizing, setSynchronizing] = useState(false);
  const onSyncAllAccounts = useCallback(() => {
    setSynchronizing(true);
    syncAllAccounts()
      .catch(e => {
        console.error(e);
      })
      .then(() => {
        setSynchronizing(false);
      });
  }, [syncAllAccounts]);

  const onAppJsonChange = useCallback(
    (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result;
        if (typeof text !== "string") return;
        try {
          const json = JSON.parse(text);
          const all: Account[] = [];
          for (const d of json.data.accounts) {
            const { data } = d;
            try {
              const account = fromAccountRaw(data);
              if (isCurrencySupported(account.currency)) {
                all.push(account);
              }
            } catch (e) {
              console.warn("ignoring an account due to", e);
            }
          }
          console.log("found all these accounts", all);
          setAccounts(state => {
            const existingSet = new Set(state.map(a => a.id));
            return state.concat(all.filter(a => !existingSet.has(a.id)));
          });
        } catch (e) {
          console.error(e);
        }
      };
      reader.readAsText(file);
    },
    [setAccounts],
  );

  return (
    <div>
      <label htmlFor="importappjson">
        <span>Import app.json: </span>
        <input id="importappjson" type="file" onChange={onAppJsonChange} />
      </label>
      <label>
        <button type="button" onClick={onSyncAllAccounts} disabled={synchronizing}>
          Synchronize all accounts
        </button>
      </label>
    </div>
  );
}

// For the send flow, the most convenient is to first select an account
// then once selected, we can assume the account is in context and move on to the second component
function HeadlessSendFlow({ accounts }: { accounts: Account[] }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const account = accounts.find(a => a.id === accountId);

  const onSelectChange = useCallback((e: any) => {
    setAccountId(e.target.value);
  }, []);

  return (
    <div>
      <label htmlFor="account">
        <span>Account</span>
        <select name="account" onChange={onSelectChange}>
          <option value="">Select an account</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {getAccountName(account)}
            </option>
          ))}
        </select>
      </label>
      {account ? <SendFlowWithAccount account={account} /> : null}
    </div>
  );
}

// that component will render the two mandatory fields of a send flow: amount and recipient
// any other fields is actually inferred with a default on all coin implementations
// we reuse the handy useBridgeTransaction here because it provide all pending state, feedbacks and errors management
// to make it prod ready, there would obviously be a lot more to do, but this is a good start. (for instance not displaying the "Required" error because yes the field are initially empty =D)
function SendFlowWithAccount({ account }: { account: Account }) {
  const bridge = getAccountBridge(account);
  const { transaction, updateTransaction, bridgeError, bridgePending, status } =
    useBridgeTransaction(() => ({ account }));
  const hasErrors = Object.keys(status.errors).length;

  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      updateTransaction(t => bridge.updateTransaction(t, { amount }));
    },
    [updateTransaction, bridge],
  );

  const onChangeRecipient = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      updateTransaction(t => bridge.updateTransaction(t, { recipient: value }));
    },
    [updateTransaction, bridge],
  );

  const onSignAndBroadcast = useCallback(() => {
    appForCurrency(deviceId, account.currency, () =>
      bridge.signOperation({
        account,
        transaction,
        deviceId,
      }),
    ).subscribe({
      next: event => {
        console.log("event", event);
        if (event.type === "signed") {
          // in theory this is what we do to broadcast for real. i just don't know if we want to activate it end 2 end for now =)
          /*
            bridge
              .broadcast({
                account,
                signedOperation: event.signedOperation,
              })
              .then(
                op => {
                  console.log("broadcasted", op);
                },
                e => {
                  console.error("broadcast error", e);
                },
              );
              */
        }
      },
      complete: () => {
        console.log("complete");
      },
      error: error => {
        console.error("error", error);
      },
    });
  }, [bridge, account, transaction]);

  if (!transaction) return null;
  return (
    <div>
      <label htmlFor="amount">
        <span>Amount</span>
        <AmountInput
          id="amount"
          value={transaction.amount}
          onChange={onChangeAmount}
          locale={locale}
          unit={account.unit}
        />
        {status.errors.amount ? <strong>{String(status.errors.amount)}</strong> : null}
      </label>
      <label htmlFor="recipient">
        <span>Recipient</span>
        <input
          name="recipient"
          id="recipient"
          type="text"
          value={transaction.recipient}
          onChange={onChangeRecipient}
        />
        {status.errors.recipient ? <strong>{String(status.errors.recipient)}</strong> : null}
      </label>
      {bridgeError ? <div>{bridgeError.message}</div> : null}
      <button
        type="submit"
        onClick={onSignAndBroadcast}
        disabled={Boolean(bridgePending || bridgeError || hasErrors)}
      >
        Sign Operation
      </button>
      {}
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  unit,
  locale,
  id,
}: {
  value: BigNumber;
  onChange: (_: BigNumber) => void;
  unit: Unit;
  locale: string;
  id: string;
}) {
  // See RequestAmount.tsx on desktop
  const [inner, setInner] = useState(() => value.toString());

  const onChangeInner = useCallback(
    (e: any) => {
      const v = e.target.value;
      const r = sanitizeValueString(unit, v, locale);
      const satoshiValue = BigNumber(r.value);
      if (!value || !value.isEqualTo(satoshiValue)) {
        onChange(satoshiValue);
      }
      setInner(v);
    },
    [unit, value, locale, onChange],
  );

  const syncInput = useCallback(
    ({ isFocused }: { isFocused: boolean }) => {
      const v = inner ? BigNumber(sanitizeValueString(unit, inner, locale).value) : value;
      setInner(
        !v || (v.isZero() && false)
          ? ""
          : formatCurrencyUnit(unit, v, {
              locale,
              useGrouping: !isFocused,
              disableRounding: true,
              showAllDigits: false,
              subMagnitude: v.isLessThan(1) ? 3 : 0,
            }),
      );
    },
    [inner, unit, value, locale],
  );

  const onBlurInner = useCallback(() => {
    syncInput({ isFocused: false });
  }, [syncInput]);

  const onFocusInner = useCallback(() => {
    syncInput({ isFocused: true });
  }, [syncInput]);

  return (
    <input
      type="text"
      value={inner}
      onChange={onChangeInner}
      onBlur={onBlurInner}
      onFocus={onFocusInner}
      id={id}
      name={id}
    />
  );
}

// Here comes the internal accounts state managements (account sync, bridges,...)

const localCache: Record<string, unknown> = {};
const bridgeCache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },

  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

type AccountUpdater = (_: Account) => Account;

// this is a minimalistic impl of a "sync all accounts"
function useSyncAllAccounts(
  accounts: Account[],
  setAccounts: (_: (_: Account[]) => Account[]) => void,
): () => Promise<void> {
  const currentAccountsRef = useRef<Account[]>(accounts);
  useEffect(() => {
    currentAccountsRef.current = accounts;
  }, [accounts]);
  const syncAllAccounts = useCallback(async () => {
    const accounts = currentAccountsRef.current;
    const parallel = 4;
    const updaters: Array<[string, AccountUpdater]> = await promiseAllBatched(
      parallel,
      accounts,
      makeSyncAccountUpdater,
    );
    setAccounts(accounts =>
      accounts.map(a => {
        const updater = updaters.find(([id]) => id === a.id);
        return updater ? updater[1](a) : a;
      }),
    );
  }, [setAccounts]);
  return syncAllAccounts;
}

async function makeSyncAccountUpdater(account: Account): Promise<[string, AccountUpdater]> {
  const bridge = getAccountBridge(account);
  // in the current implementation, it is mandatory to have prepare the currency before syncing
  // the cache will ensure not to do it twice
  await bridgeCache.prepareCurrency(account.currency);
  const syncConfig = {
    paginationConfig: {},
    blacklistedTokenIds: [],
  };

  const observable = bridge.sync(account, syncConfig);
  const reduced = observable.pipe(reduce((a, f) => f(a), account));
  const sync = await lastValueFrom(reduced);
  const updater = (_: Account) => sync; // FIXME here, account may have changed by an external update, we ignore this for now
  return [account.id, updater];
}

// this implement a storage of accounts into localStorage
// we explicitly remove the heavy data of these accounts with some sanitization
function useLocalStorage(
  accounts: Account[],
  setAccounts: (_: (_: Account[]) => Account[]) => void,
) {
  // on first load, we import the accounts from localStorage
  useEffect(() => {
    const data = localStorage.getItem("accounts");
    if (!data) return;
    const accounts = JSON.parse(data);
    setAccounts(() => accounts.map(fromAccountRaw));
  }, [setAccounts]);

  // on each accounts change, we save the accounts into localStorage
  useEffect(() => {
    const data = accounts.map(a => {
      const cleared = clearAccount(a);
      return toAccountRaw(cleared);
    });
    localStorage.setItem("accounts", JSON.stringify(data));
  }, [accounts]);
}

// thin headless wrapper to first do the logic that will drive all the calls to access the app (NB: we may want to hook UI to it in future)
function appForCurrency<T>(
  deviceId: string,
  currency: Currency,
  scanAccounts: () => Observable<T>,
): Observable<T> {
  return scanAccounts();
}

export default App;
