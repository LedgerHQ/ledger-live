import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Observable, concat, find, from, ignoreElements, mergeMap, tap } from "rxjs";
import { Button } from "@ledgerhq/lumen-ui-react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
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
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { Account, BridgeCacheSystem } from "@ledgerhq/types-live";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { listSupportedCurrencies } from "@ledgerhq/ledger-wallet-framework/currencies/support";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/color";
import { getValidCryptoIconSize } from "@ledgerhq/live-common/helpers/cryptoIconSize";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { Loading } from "./Loading";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { Tick } from "./Tick";
import { State } from "./types";
import { Actionable } from "./Actionable";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

const latestWalletStateSelector = (s: State): WSState => walletSyncStateSelector(s.walletState);

const localStateSelector = (state: State) => ({
  accounts: {
    list: state.accounts,
    nonImportedAccountInfos: state.nonImportedAccounts,
  },
  accountNames: state.walletState.accountNames,
  recentAddresses: state.walletState.recentAddresses,
});

const latestDistantStateSelector = (state: State) => state.walletState.walletSyncState.data;
const latestDistantVersionSelector = (state: State) => state.walletState.walletSyncState.version;

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

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const getState = useCallback(() => stateRef.current, []);

  const getCurrentVersion = useCallback(
    () => stateRef.current.walletState.walletSyncState.version,
    [],
  );

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

  const ctx = useMemo(
    () => ({ getAccountBridge, bridgeCache, blacklistedTokenIds: [] }),
    [bridgeCache],
  );

  const saveUpdate = useCallback(
    async (data: DistantState | null, version: number, newLocalState: LocalState | null) => {
      setState(s => {
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
            accounts: newLocalState.accounts.list,
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
        latestDistantVersionSelector,
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
    <div className="flex flex-col gap-8">
      {error ? (
        <div className="p-10 text-error body-2">{error.message}</div>
      ) : timestamp ? (
        <div className="text-center body-2 text-muted">
          Synced <Tick timestamp={timestamp} />.{" "}
          <Button size="sm" appearance="transparent" onClick={() => onUserRefresh()}>
            Refresh
          </Button>
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
        <div className="p-10 text-center text-warning body-2">
          {state.nonImportedAccounts.length} non-imported accounts
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

function HeadlessAddAccounts({
  deviceId,
  bridgeCache,
  setAccounts,
}: {
  deviceId: string;
  bridgeCache: BridgeCacheSystem;
  setAccounts: (_: (_: Account[]) => Account[]) => void;
}) {
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
      return () => {
        sub.unsubscribe();
      };
    },
    [deviceId, addAccounts, bridgeCache],
  );
  return (
    <div className="p-10 text-center">
      <form onSubmit={onSubmit} className="flex items-center justify-center gap-8 flex-wrap">
        <label htmlFor="currency" className="body-2 text-base">
          Add accounts for
        </label>
        <select
          name="currency"
          id="currency"
          className="bg-base border border-base rounded-md px-8 py-6 body-2 text-base"
        >
          <option value="">Select a currency</option>
          {listSupportedCurrencies().map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button size="sm" type="submit" disabled={disabled}>
          Search with device
        </Button>
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
  const currency = getAccountCurrency(account);

  const ledgerId = currency.id;
  const ticker = currency.ticker;
  const network = currency.type === "TokenCurrency" ? currency.parentCurrency.id : undefined;
  const validSize = getValidCryptoIconSize(20);

  return (
    <li className="flex items-center px-16 py-6 border-b border-base">
      <span className="mr-10 flex items-center">
        {currency.type === "TokenCurrency" ? (
          <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} network={network} />
        ) : (
          <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} />
        )}
      </span>
      <span className="flex-1 min-w-[50%]">
        <EditableAccountNameField
          name={accountNameWithDefaultSelector(walletState, account)}
          setName={name => setAccountName(account.id, name)}
        />
      </span>
      <span className="body-2-semi-bold" style={{ color: getCurrencyColor(account.currency) }}>
        {formatCurrencyUnit(account.currency.units[0], account.balance, { showCode: true })}
      </span>
      <span className="flex-1" />
      <code className="body-4 pr-10 text-muted">{account.freshAddressPath}</code>
      <span>
        <Button size="sm" appearance="transparent" type="button" onClick={() => removeAccount(account.id)}>
          Remove
        </Button>
      </span>
    </li>
  );
}

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
      <div className="text-center body-1 text-muted">No accounts.</div>
    );
  }
  return (
    <ul className="p-0 mx-16 my-10 list-none">
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

function EditableAccountNameField({
  name,
  setName,
}: {
  name: string;
  setName: (_: string) => void;
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
      <input
        className="w-full body-2-semi-bold border-none outline-none bg-transparent p-0"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoFocus
      />
    </form>
  ) : (
    <span className="w-full inline-block body-2-semi-bold cursor-pointer" onClick={onEdit}>
      {value}
    </span>
  );
}

function appForCurrency<T>(
  deviceId: string,
  currency: CryptoCurrency,
  job: () => Observable<T>,
): Observable<T> {
  return connectApp()({
    deviceId,
    deviceName: null,
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
