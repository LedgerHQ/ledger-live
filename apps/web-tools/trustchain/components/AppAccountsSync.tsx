import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Observable, concat, find, from, ignoreElements, mergeMap, tap } from "rxjs";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { useTrustchainSDK } from "../context";
import { CloudSyncSDK } from "@ledgerhq/live-wallet/cloudsync/index";
import {
  WalletState,
  handlers as walletHandlers,
  accountNameWithDefaultSelector,
  setAccountName as setAccountNameAction,
  WSState,
  setAccountNames,
  walletSyncUpdate,
  walletSyncStateSelector,
} from "@ledgerhq/live-wallet/store";
import walletsync, {
  liveSlug,
  DistantState,
  walletSyncWatchLoop,
  makeSaveNewUpdate,
  LocalState,
  makeLocalIncrementalUpdate,
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
import { Tick } from "./Tick";
import { State } from "./types";
import { Actionable } from "./Actionable";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

/*
import * as icons from "@ledgerhq/crypto-icons-ui/react";
import { inferCryptoCurrencyIcon } from "@ledgerhq/live-common/currencies/cryptoIcons";
*/

const latestWalletStateSelector = (s: State): WSState => walletSyncStateSelector(s.walletState);

const localStateSelector = (state: State) => ({
  accounts: {
    list: state.accounts,
    nonImportedAccountInfos: state.nonImportedAccounts,
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
  const getState = useCallback(() => stateRef.current, []);

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
  const ctx = useMemo(
    () => ({ getAccountBridge, bridgeCache, blacklistedTokenIds: [] }),
    [bridgeCache],
  );

  const saveUpdate = useCallback(
    async (data: DistantState | null, version: number, newLocalState: LocalState | null) => {
      setState(s => {
        // we now need to "reverse" the localStateSelector back into our own internal state
        let walletState = s.walletState;
        if (newLocalState) {
          walletState = walletHandlers.BULK_SET_ACCOUNT_NAMES(
            walletState,
            setAccountNames(newLocalState.accountNames),
          );
        }
        walletState = walletHandlers.WALLET_SYNC_UPDATE(
          walletState,
          walletSyncUpdate(data, version),
        );
        if (newLocalState) {
          return {
            accounts: newLocalState.accounts.list, // save new accounts
            nonImportedAccounts: newLocalState.accounts.nonImportedAccountInfos,
            walletState,
          };
        }
        return {
          ...s,
          walletState,
        };
      });
    },
    [setState],
  );

  const saveNewUpdate = useMemo(
    () =>
      makeSaveNewUpdate({
        ctx,
        getState,
        latestDistantStateSelector,
        localStateSelector,
        saveUpdate,
      }),
    [ctx, getState, saveUpdate],
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
        apiBaseUrl: getWalletSyncEnvironmentParams("STAGING").cloudSyncApiBaseUrl,
        slug: liveSlug,
        schema: walletsync.schema,
        trustchainSdk,
        getCurrentVersion,
        saveNewUpdate,
      }),
    [trustchainSdk, getCurrentVersion, saveNewUpdate],
  );

  const [visualPending, setVisualPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timestamp, setTimestamp] = useState(0);
  const [onUserRefresh, setOnUserRefresh] = useState<() => void>(() => () => {});

  const [watchConfig, setWatchConfig] = useState({ notificationsEnabled: false });

  // pull and push wallet sync loop
  useEffect(() => {
    const localIncrementUpdate = makeLocalIncrementalUpdate({
      ctx,
      getState,
      latestWalletStateSelector,
      localStateSelector,
      saveUpdate,
    });

    const { unsubscribe, onUserRefreshIntent } = walletSyncWatchLoop({
      watchConfig,
      walletSyncSdk,
      localIncrementUpdate,
      trustchain,
      memberCredentials,
      setVisualPending,
      getState,
      localStateSelector,
      latestDistantStateSelector,
      onTrustchainRefreshNeeded,
      onError: e => setError(e && e instanceof Error ? e : new Error(String(e))),
      onStartPolling: () => {
        setError(null);
        setTimestamp(Date.now());
      },
    });
    setOnUserRefresh(() => onUserRefreshIntent);

    return unsubscribe;
  }, [
    trustchainSdk,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    onTrustchainRefreshNeeded,
    getState,
    saveUpdate,
    ctx,
    watchConfig,
  ]);

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
        walletState: walletHandlers.SET_ACCOUNT_NAME(s.walletState, setAccountNameAction(id, name)),
      }));
    },
    [setState],
  );

  return (
    <div>
      {error ? (
        <div style={{ padding: 10, color: "red" }}>{error.message}</div>
      ) : timestamp ? (
        <div
          style={{
            textAlign: "center",
          }}
        >
          Synced <Tick timestamp={timestamp} />.{" "}
          <button onClick={() => onUserRefresh()}>Refresh</button>
        </div>
      ) : null}
      <HeadlessShowAccounts
        walletState={state.walletState}
        accounts={state.accounts}
        setAccounts={setAccounts}
        setAccountName={setAccountName}
        loading={visualPending}
      />
      {state.nonImportedAccounts.length > 0 ? (
        <div style={{ padding: 10, textAlign: "center", color: "#fa0" }}>
          ⚠️ {state.nonImportedAccounts.length} non-imported accounts
        </div>
      ) : null}
      <HeadlessAddAccounts
        deviceId={deviceId}
        bridgeCache={bridgeCache}
        setAccounts={setAccounts}
      />

      <Actionable
        buttonTitle="Toggle WebSocket notifications"
        inputs={[watchConfig.notificationsEnabled]}
        action={enabled => !enabled}
        value={watchConfig.notificationsEnabled}
        setValue={notificationsEnabled =>
          typeof notificationsEnabled === "boolean" && setWatchConfig({ notificationsEnabled })
        }
        valueDisplay={v => (v ? "Listening" : "Not listening")}
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
