import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { Observable, concat, defer, find, from, ignoreElements, mergeMap, tap } from "rxjs";
import { Button } from "@ledgerhq/lumen-ui-react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useTrustchainSDK } from "../context";
import { CloudSyncSDK } from "@shared/cloud-sync";
import { type WSState } from "@domain/entity-wallet-sync";
import { type WalletState } from "./types";
import { liveSlug } from "./walletSync";
import {
  bindCtx as bindLiveWalletAccountsCtx,
  type NonImportedAccountInfo,
} from "@ledgerhq/live-wallet/accounts";
import { createAggregator } from "@shared/cloud-sync-module";
import {
  createWalletSyncWatchLoop,
  makeSaveNewUpdate,
  makeLocalIncrementalUpdate,
} from "@features/platform-wallet-sync";
import {
  recentAddressesSyncModule,
  type RecentAddressesState,
} from "@domain/entity-recent-addresses";
import {
  accountNamesSyncModule,
  accountNameWithDefaultSelector,
} from "@domain/entity-account-name";
import { contactsSyncModule, type Contact } from "@domain/entity-contact";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import type { AccountBalanceStatus } from "@domain/entity-account-balance";
import { useAccountBalance } from "@features/platform-account-data/react";
import { bridgeCache } from "../../logic/syncAccount";
import { accountRefOf } from "../../logic/accountData";
import { balanceOnlyAccountBridge } from "../../logic/balanceOnlyBridge";
import { getCryptoCurrencyById, listCryptoCurrencies } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { Loading } from "./Loading";
import { Tick } from "./Tick";
import { State } from "./types";
import { Actionable } from "./Actionable";
import { createContact, ContactsSync } from "./ContactsSync";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

const latestWalletStateSelector = (s: State): WSState => s.walletState.walletSyncState;

const localStateSelector = (state: State) => ({
  accounts: {
    list: state.accounts,
    nonImportedAccountInfos: state.nonImportedAccounts,
  },
  accountNames: state.walletState.accountNames,
  contacts: state.walletState.contacts,
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
  const contactsRef = useRef(state.walletState.contacts);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    contactsRef.current = state.walletState.contacts;
  }, [state.walletState.contacts]);
  const getState = useCallback(() => stateRef.current, []);

  const getCurrentVersion = useCallback(
    () => stateRef.current.walletState.walletSyncState.version,
    [],
  );

  // Resolving an incoming descriptor no longer costs a full account sync: the accounts cloud-sync
  // module only ever calls `bridge.sync` on this context, and `balanceOnlyAccountBridge` answers it
  // with a `{ balance }` request routed through the account-data layer.
  const ctx = useMemo(
    () => ({
      getAccountBridge: balanceOnlyAccountBridge,
      bridgeCache,
      blacklistedTokenIds: [],
    }),
    [],
  );

  const accountsSyncModule = useMemo(() => bindLiveWalletAccountsCtx(ctx), [ctx]);

  const walletsync = useMemo(
    () =>
      createAggregator(
        {
          accounts: accountsSyncModule,
          accountNames: accountNamesSyncModule,
          contacts: contactsSyncModule,
          recentAddresses: recentAddressesSyncModule,
        },
        // warn, not error: a quarantine is recoverable, and this devtool is where a corrupted
        // slice is most likely to be inspected, so it should stay visible in the console
        { onModuleError: (_key, error) => console.warn(error.message) },
      ),
    [accountsSyncModule],
  );

  type AggLocalState = {
    accounts: {
      list: Account[];
      nonImportedAccountInfos: NonImportedAccountInfo[];
    };
    accountNames: Map<string, string>;
    contacts: Contact[];
    recentAddresses: RecentAddressesState;
  };

  const saveUpdate = useCallback(
    async (data: unknown, version: number, newLocalState: AggLocalState | null) => {
      setState(s => {
        let walletState = s.walletState;
        if (newLocalState) {
          const mergedAccountNames = new Map(walletState.accountNames);
          for (const [id, name] of newLocalState.accountNames) {
            mergedAccountNames.set(id, name);
          }
          contactsRef.current = newLocalState.contacts;
          walletState = {
            ...walletState,
            accountNames: mergedAccountNames,
            contacts: newLocalState.contacts,
          };
        }
        walletState = {
          ...walletState,
          walletSyncState: { data: data as WSState["data"], version },
        };
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
        walletsync,
        getState,
        latestDistantStateSelector,
        latestDistantVersionSelector,
        localStateSelector,
        saveUpdate,
      }),
    [walletsync, getState, saveUpdate],
  );

  const onTrustchainRefreshNeeded = useCallback(
    async (trustchain: Trustchain) => {
      try {
        const newTrustchain = await trustchainSdk.restoreTrustchain(trustchain, memberCredentials);
        setTrustchain(newTrustchain);
      } catch (e) {
        if ((e as { name?: string })?.name === "TrustchainEjected") {
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

  const [watchConfig, setWatchConfig] = useState({
    notificationsEnabled: false,
  });

  useEffect(() => {
    const localIncrementUpdate = makeLocalIncrementalUpdate({
      walletsync,
      getState,
      latestWalletStateSelector,
      localStateSelector,
      saveUpdate,
    });

    const { unsubscribe, onUserRefreshIntent } = createWalletSyncWatchLoop({
      walletsync,
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
    walletsync,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    onTrustchainRefreshNeeded,
    getState,
    saveUpdate,
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
      setState(s => {
        const accountNames = new Map(s.walletState.accountNames);
        if (!name) {
          accountNames.delete(id);
        } else {
          accountNames.set(id, name);
        }
        return { ...s, walletState: { ...s.walletState, accountNames } };
      });
    },
    [setState],
  );

  const handleCreateContact = useCallback(
    (draftName: string) => {
      const result = createContact(contactsRef.current, draftName);
      if (result.contact !== null) {
        const contacts = [...contactsRef.current, result.contact];
        contactsRef.current = contacts;
        setState(s => ({ ...s, walletState: { ...s.walletState, contacts } }));
      }
      return result;
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
      <ContactsSync contacts={state.walletState.contacts} onCreate={handleCreateContact} />
      {state.nonImportedAccounts.length > 0 ? (
        <div className="p-10 text-center text-warning body-2">
          {state.nonImportedAccounts.length} non-imported accounts
        </div>
      ) : null}
      <HeadlessAddAccounts deviceId={deviceId} setAccounts={setAccounts} />

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
  setAccounts,
}: {
  deviceId: string;
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
      const sub = appForCurrency(deviceId, currency, () =>
        defer(() => Promise.resolve(getCurrencyBridge(currency))).pipe(
          mergeMap(currencyBridge =>
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
          ),
        ),
      ).subscribe({
        next: (event: ScanAccountEvent) => {
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
    [deviceId, addAccounts],
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
          {listCryptoCurrencies().map(c => (
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
  const network = currency.type === "TokenCurrency" ? currency.parentCurrencyId : undefined;
  const validSize = 20;

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
          name={accountNameWithDefaultSelector(walletState.accountNames, account)}
          setName={name => setAccountName(account.id, name)}
        />
      </span>
      <AccountBalanceCell account={account} />
      <span className="flex-1" />
      <code className="body-4 pr-10 text-muted">{account.freshAddressPath}</code>
      <span>
        <Button
          size="sm"
          appearance="transparent"
          type="button"
          onClick={() => removeAccount(account.id)}
        >
          Remove
        </Button>
      </span>
    </li>
  );
}

/**
 * Where the number on screen came from, flattened out of a ternary chain: pending wins over an
 * error, an error over a source, and "from sync" is what is left when the layer has not read it —
 * the amount then comes off the `Account` the legacy sync produced.
 */
function statusLine(status: AccountBalanceStatus): string {
  if (status.pending) return "reading balance…";
  if (status.error) return status.error;
  return status.sourceId ? `via ${status.sourceId}` : "from sync";
}

/**
 * The balance, read from `@domain/entity-account-balance` rather than off the `Account`.
 *
 * Two things this makes visible that the god-object read could not: which source answered
 * (`granular` = one chain call, `full-sync` = the whole account), and the token balances that came
 * back in that *same* single call — the property that makes the granular path worth having.
 */
function AccountBalanceCell({ account }: Readonly<{ account: Account }>) {
  const ref = useMemo(
    () => accountRefOf(account),
    // Rebuilt only when the identity behind the ref moves, not on every sync that replaces the object.
    [account.id, account.currency.id, account.freshAddress, account.derivationMode],
  );
  const { balance, subAccountBalances, status } = useAccountBalance(ref);
  const amount = balance ? new BigNumber(balance.balance) : account.balance;

  return (
    <span className="flex flex-col items-end">
      <span className="body-2-semi-bold" style={{ color: getCurrencyColor(account.currency) }}>
        {formatCurrencyUnit(account.currency.units[0], amount, {
          showCode: true,
        })}
      </span>
      <span className="body-4 text-muted">{statusLine(status)}</span>
      {subAccountBalances.map(sub => (
        <span key={sub.accountId} className="body-4 text-muted">
          {sub.assetId}: {sub.balance}
        </span>
      ))}
    </span>
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
