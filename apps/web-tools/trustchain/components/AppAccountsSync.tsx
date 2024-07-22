import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Observable, concat, find, from, ignoreElements, mergeMap, tap } from "rxjs";
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { useTrustchainSDK } from "../context";
import { CloudSyncSDK, UpdateEvent } from "@ledgerhq/live-wallet/cloudsync/index";
import {
  WalletState,
  handlers as walletH,
  accountNameWithDefaultSelector,
  setAccountName as setAccountNameAction,
  WSState,
  setAccountNames,
  walletSyncUpdate,
} from "@ledgerhq/live-wallet/store";
import walletsync, {
  liveSlug,
  DistantState,
  walletSyncWatchLoop,
} from "@ledgerhq/live-wallet/walletsync/index";
import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Account, BridgeCacheSystem } from "@ledgerhq/types-live";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { listSupportedCurrencies } from "@ledgerhq/coin-framework/lib-es/currencies/support";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/color";
import { Loading } from "./Loading";
import { TrustchainEjected } from "@ledgerhq/trustchain/lib-es/errors";

/*
import * as icons from "@ledgerhq/crypto-icons-ui/react";
import { inferCryptoCurrencyIcon } from "@ledgerhq/live-common/currencies/cryptoIcons";
*/

type State = {
  accounts: Account[];
  walletState: WalletState;
};

const localStateSelector = (state: State) => ({
  accounts: {
    list: state.accounts,
  },
  accountNames: state.walletState.accountNames,
});

const latestDistantStateSelector = (state: State) => state.walletState.walletSyncState.data;

export default function AppAccountsSync({
  deviceId,
  trustchain,
  memberCredentials,
  state,
  setState,
  setTrustchain,
}: {
  deviceId: string;
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  state: State;
  setState: (_: (_: State) => State) => void;
  setTrustchain: (_: Trustchain | null) => void;
}) {
  const trustchainSdk = useTrustchainSDK();

  // our state stays local here but is still managed as one single state for atomic update management
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getCurrentVersion = useCallback(
    () => stateRef.current.walletState.walletSyncState.version,
    [],
  );

  // in memory implementation of bridgeCache
  const bridgeCache = useMemo(() => {
    const localCache: Record<string, unknown> = {};
    const cache = makeBridgeCacheSystem({
      saveData(c, d) {
        localCache[c.id] = d;
        return Promise.resolve();
      },
      getData(c) {
        return Promise.resolve(localCache[c.id]);
      },
    });
    return cache;
  }, []);

  // saveNewUpdate implements the state update logic
  const saveNewUpdate = useCallback(
    async (event: UpdateEvent<DistantState>) => {
      switch (event.type) {
        case "new-data": {
          const state = stateRef.current;
          const version = event.version;
          const data = event.data;
          const walletSyncState = state.walletState.walletSyncState;
          const localState = localStateSelector(state);
          const ctx = { getAccountBridge, bridgeCache, blacklistedTokenIds: [] };

          console.log("<- incoming data to resolve", data);
          const resolved = await walletsync.resolveIncomingDistantState(
            ctx,
            localState,
            walletSyncState.data,
            data,
          );

          if (resolved.hasChanges) {
            console.log("resolved as", resolved);
            // the important part is to keep one atomic update for all the states
            setState(s => {
              const localState = localStateSelector(s);
              const newLocalState = walletsync.applyUpdate(localState, resolved.update);
              console.log("new update applied as", newLocalState);

              // we now need to "reverse" the localStateSelector back into our own internal state
              let walletState = s.walletState;
              walletState = walletH.BULK_SET_ACCOUNT_NAMES(
                walletState,
                setAccountNames(newLocalState.accountNames),
              );
              walletState = walletH.WALLET_SYNC_UPDATE(
                walletState,
                walletSyncUpdate(data, version),
              );
              return {
                accounts: newLocalState.accounts.list, // save new accounts
                walletState,
              };
            });
          } else {
            console.log("resolved. no changes to apply.");
          }
          break;
        }
        case "pushed-data": {
          // when we push the state, we also need to implement the update on the local state
          setState(s => ({
            ...s,
            walletState: walletH.WALLET_SYNC_UPDATE(
              s.walletState,
              walletSyncUpdate(event.data, event.version),
            ),
          }));
          break;
        }
        case "deleted-data": {
          console.log("deleted data");
          setState(s => ({
            ...s,
            walletState: walletH.WALLET_SYNC_UPDATE(s.walletState, walletSyncUpdate(null, 0)),
          }));
          break;
        }
      }
    },
    [bridgeCache, setState],
  );

  const onTrustchainRefreshNeeded = useCallback(
    async (trustchain: Trustchain) => {
      try {
        const newTrustchain = await trustchainSdk.restoreTrustchain(trustchain, memberCredentials);
        setTrustchain(newTrustchain);
      } catch (e) {
        if (e instanceof TrustchainEjected) {
          setTrustchain(null);
        }
      }
    },
    [trustchainSdk, setTrustchain, memberCredentials],
  );

  const walletSyncSdk = useMemo(
    () =>
      new CloudSyncSDK({
        slug: liveSlug,
        schema: walletsync.schema,
        trustchainSdk,
        getCurrentVersion,
        saveNewUpdate,
      }),
    [trustchainSdk, getCurrentVersion, saveNewUpdate],
  );

  const [visualPending, setVisualPending] = useState(true);

  // pull and push wallet sync loop
  useEffect(() => {
    const { unsubscribe } = walletSyncWatchLoop({
      walletSyncSdk,
      trustchain,
      memberCredentials,
      setVisualPending,
      getState: () => stateRef.current,
      localStateSelector,
      latestDistantStateSelector,
      onTrustchainRefreshNeeded,
    });

    return unsubscribe;
  }, [trustchainSdk, walletSyncSdk, trustchain, memberCredentials, onTrustchainRefreshNeeded]);

  const setAccounts = useCallback(
    (fn: (_: Account[]) => Account[]) => {
      setState(s => ({ ...s, accounts: fn(s.accounts) }));
    },
    [setState],
  );

  const setAccountName = useCallback(
    (id: string, name: string) => {
      setState(s => ({
        ...s,
        walletState: walletH.SET_ACCOUNT_NAME(s.walletState, setAccountNameAction(id, name)),
      }));
    },
    [setState],
  );

  return (
    <div>
      <HeadlessShowAccounts
        walletState={state.walletState}
        accounts={state.accounts}
        setAccounts={setAccounts}
        setAccountName={setAccountName}
        loading={visualPending}
      />
      <HeadlessAddAccounts
        deviceId={deviceId}
        bridgeCache={bridgeCache}
        setAccounts={setAccounts}
      />
    </div>
  );
}

// This is the part that handles adding accounts with a device
// at the moment, when user client "Add accounts" we directly assume the device is connected and already on the correct app
// in future, we can explore automation on automatically detecting the device, app and triggering the appropriate open app action to do so
// this is what the component <DeviceAction> offers in ledger-live-desktop , but we went minimalistic here. In future, device-sdk should have this in scope.
function HeadlessAddAccounts({
  deviceId,
  bridgeCache,
  setAccounts,
}: {
  deviceId: string;
  bridgeCache: BridgeCacheSystem;
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
        concat(
          from(bridgeCache.prepareCurrency(currency)).pipe(ignoreElements()),
          currencyBridge.scanAccounts({
            currency,
            deviceId,
            syncConfig: {
              paginationConfig: {},
              blacklistedTokenIds: [],
            },
          }),
        ),
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
    [deviceId, addAccounts, bridgeCache],
  );
  return (
    <div style={{ padding: 10, textAlign: "center" }}>
      <form onSubmit={onSubmit}>
        <label htmlFor="currency">
          <span>Add accounts for</span>
          <select style={{ margin: 10 }} name="currency" id="currency">
            <option value="">Select a currency</option>
            {listSupportedCurrencies().map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={disabled}>
          Search with device
        </button>
      </form>
    </div>
  );
}

function AccountRow({
  account,
  walletState,
  setAccountName,
  removeAccount,
}: {
  account: Account;
  walletState: WalletState;
  setAccountName: (id: string, name: string) => void;
  removeAccount: (id: string) => void;
}) {
  return (
    <li
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "5px 20px",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <span style={{ flex: 1, minWidth: "50%" }}>
        <EditableAccountNameField
          name={accountNameWithDefaultSelector(walletState, account)}
          setName={name => setAccountName(account.id, name)}
          style={{
            width: "100%",
            display: "inline-block",
            fontWeight: 600,
            fontSize: 16,
            padding: 0,
            border: "none",
            outline: "none",
          }}
        />
      </span>
      <span style={{ color: getCurrencyColor(account.currency), fontWeight: 600 }}>
        {formatCurrencyUnit(account.currency.units[0], account.balance, { showCode: true })}
      </span>
      <span style={{ flex: 1 }} />
      <code style={{ color: "#bbb", fontSize: 10, paddingRight: 10, fontWeight: 400 }}>
        {account.freshAddressPath}
      </code>
      <span>
        <button type="button" onClick={() => removeAccount(account.id)}>
          🗑️
        </button>
      </span>
    </li>
  );
}

// This is the part that just show the accounts as they are.
// there is just an action to delete on each action, convenient as i've made the previous add accounts to directly append into the list
// we may totally change this state management paradigm if we want
function HeadlessShowAccounts({
  walletState,
  accounts,
  setAccounts,
  setAccountName,
  loading,
}: {
  walletState: WalletState;
  accounts: Account[];
  setAccounts: (_: (_: Account[]) => Account[]) => void;
  setAccountName: (id: string, name: string) => void;
  loading: boolean;
}) {
  const removeAccount = useCallback(
    (accountId: string) => {
      setAccounts(state => state.filter(a => a.id !== accountId));
    },
    [setAccounts],
  );

  if (accounts.length === 0) {
    return loading ? (
      <Loading />
    ) : (
      <div style={{ textAlign: "center", fontSize: 18 }}>No accounts.</div>
    );
  }
  return (
    <ul style={{ padding: 0, margin: "10px 20px" }}>
      {accounts.map(account => (
        <AccountRow
          key={account.id}
          account={account}
          walletState={walletState}
          setAccountName={setAccountName}
          removeAccount={removeAccount}
        />
      ))}
    </ul>
  );
}

/*
const CircleWrapper = styled.div<{ size: number }>`
  border-radius: 50%;
  border: 1px solid transparent;
  background: ${p => p.color};
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
  display: flex;
`;

function CryptoCurrencyIcon({ currency, size }: { currency: CryptoCurrency; size: number }) {
  const color = getCurrencyColor(currency);
  const IconCurrency = inferCryptoCurrencyIcon<
    React.ComponentType<{ size: number; color: string }>
  >(icons, currency);
  if (!IconCurrency) return null;
  return (
    <CircleWrapper size={size} color={color}>
      <IconCurrency size={size * 0.8} color="white" />
    </CircleWrapper>
  );
}
  */

function EditableAccountNameField({
  name,
  setName,
  style,
}: {
  name: string;
  setName: (_: string) => void;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  useEffect(() => {
    setValue(name);
  }, [name]);
  const onEdit = useCallback(() => {
    setEditing(true);
  }, []);
  const onChange = useCallback((e: any) => {
    setValue(e.target.value);
  }, []);
  const onBlur = useCallback(() => {
    setName(value);
    setEditing(false);
  }, [setName, value]);
  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setName(value);
      setEditing(false);
    },
    [setName, value],
  );
  return editing ? (
    <form onSubmit={onSubmit}>
      <input style={style} value={value} onChange={onChange} onBlur={onBlur} autoFocus />
    </form>
  ) : (
    <span style={style} onClick={onEdit}>
      {value}
    </span>
  );
}

// thin headless wrapper to first do the logic that will drive all the calls to access the app (NB: we may want to hook UI to it in future)
function appForCurrency<T>(
  deviceId: string,
  currency: CryptoCurrency,
  job: () => Observable<T>,
): Observable<T> {
  return connectApp({
    deviceId,
    request: {
      appName: currency.managerAppName,
      allowPartialDependencies: false,
    },
  }).pipe(
    tap(e => console.log("connectApp", e)),
    find(e => e.type === "opened"),
    mergeMap(job),
  );
}
