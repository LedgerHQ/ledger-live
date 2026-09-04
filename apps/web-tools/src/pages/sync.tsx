import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { encodeAccountId, decodeAccountId } from "@ledgerhq/live-common/account/index";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { Account } from "@ledgerhq/types-live";
import { Button, Spinner, TextInput } from "@ledgerhq/lumen-ui-react";
import type { AccountBalanceStatus } from "@domain/entity-account-balance";
import { useAccountBalance } from "@features/platform-account-data/react";
import { ToolPage } from "../components/ToolPage";
import { inferAccount, syncAccount } from "../logic/syncAccount";
import { accountRefOf } from "../logic/accountData";

function App() {
  // synchronise account with an id that is input in a input text field
  const [accountId, setAccountId] = useState("");
  const [accountIdError, setAccountIdError] = useState("");

  const [account, setAccount] = useState<Account | undefined | null>(null);
  const [accountError, setAccountError] = useState("");
  const [fullSyncRequested, setFullSyncRequested] = useState(false);

  useEffect(() => {
    // if we have an accountId, we try to infer it
    if (accountId) {
      try {
        setAccountId(inferAccountId(accountId));
        setAccountIdError("");
      } catch (e: unknown) {
        setAccountIdError(String((e as { message?: unknown })?.message));
      }
    }
  }, [accountId]);

  const validAccountId = useMemo(() => {
    if (!accountId) return undefined;
    try {
      decodeAccountId(accountId);
      return accountId;
    } catch {
      return undefined;
    }
  }, [accountId]);

  useEffect(() => {
    setFullSyncRequested(false);
    setAccount(null);
    setAccountError("");
  }, [validAccountId]);

  // A sync in flight when the id changes must not paint the previous account's JSON under the new
  // one: every run carries the generation it was started for, and a later generation discards it.
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
  }, [validAccountId]);

  const onFullSync = useCallback(() => {
    if (!validAccountId) return;
    const startedAt = generation.current;
    setFullSyncRequested(true);
    setAccountError("");
    setAccount(undefined);
    syncAccount(validAccountId).then(
      synced => {
        if (generation.current === startedAt) setAccount(synced);
      },
      e => {
        if (generation.current === startedAt) setAccountError(String(e));
      },
    );
  }, [validAccountId]);

  const isLoading = fullSyncRequested && account === undefined && !accountError;

  return (
    <ToolPage
      title="Synchronisation"
      description="Read an account's balance through the account-data layer, or run a full legacy sync to inspect everything else."
    >
      <TextInput
        label="Account id"
        placeholder="ethereum:0x… or js:2:ethereum:0x…:"
        value={accountId}
        onChange={e => setAccountId(e.target.value)}
        status={accountIdError ? "error" : undefined}
        helperText={accountIdError || undefined}
      />

      {validAccountId ? <BalancePanel accountId={validAccountId} /> : null}

      <div className="flex flex-col gap-8">
        <div>
          <Button size="sm" disabled={!validAccountId || isLoading} onClick={onFullSync}>
            Run a full legacy sync
          </Button>
        </div>
        {accountError ? (
          <p className="body-2 text-error">{String(accountError)}</p>
        ) : isLoading ? (
          <span className="inline-flex items-center gap-8 body-2 text-muted">
            <Spinner size={16} /> Synchronising…
          </span>
        ) : null}
        {account ? (
          <pre className="max-h-[60vh] overflow-auto rounded-lg border border-base bg-muted p-16 body-3 text-base">
            <code>{JSON.stringify(account, null, 2)}</code>
          </pre>
        ) : !accountError && !isLoading ? (
          <p className="body-2 text-muted">
            The full sync fetches the whole account — operations, balance history, family resources.
            The balance above needs none of it.
          </p>
        ) : null}
      </div>
    </ToolPage>
  );
}

/**
 * One line saying where the number came from, flattened out of a ternary chain: an error wins over
 * a source, and "no read yet" is the only case left.
 */
function sourceLine(status: AccountBalanceStatus, assetCount: number): string {
  if (status.error) return status.error;
  if (!status.sourceId) return "no read yet";
  const extra = assetCount > 1 ? ` — ${assetCount} assets in one read` : "";
  return `served by ${status.sourceId}${extra}`;
}

/**
 * The balance, and only the balance.
 *
 * `useAccountBalance` reads the balance and nothing else, so on a family with a granular coin module
 * this is one `getBalance` call — no operation history, no balance-history derivation. `sourceId`
 * says which source answered, which is the whole point of the panel: it is the cheapest way to watch
 * the hybrid selection happen.
 */
function BalancePanel({ accountId }: Readonly<{ accountId: string }>) {
  const account = useMemo(() => {
    try {
      return inferAccount(accountId);
    } catch {
      return undefined;
    }
  }, [accountId]);
  const ref = useMemo(() => (account ? accountRefOf(account) : undefined), [account]);
  const { balance, subAccountBalances, status, refresh } = useAccountBalance(ref);
  const unit = account?.currency.units[0];

  if (!account || !unit) return <p className="body-2 text-error">Unsupported currency.</p>;

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-base p-16">
      <div className="flex items-baseline gap-8">
        <span className="body-1-semi-bold">
          {balance
            ? formatCurrencyUnit(unit, new BigNumber(balance.balance), {
                showCode: true,
              })
            : "—"}
        </span>
        {status.pending ? <Spinner size={12} /> : null}
        <Button size="sm" appearance="transparent" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      {balance && balance.spendableBalance !== balance.balance ? (
        <span className="body-3 text-muted">
          spendable{" "}
          {formatCurrencyUnit(unit, new BigNumber(balance.spendableBalance), {
            showCode: true,
          })}
        </span>
      ) : null}
      {subAccountBalances.length > 0 ? (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {subAccountBalances.map(sub => (
            <li key={sub.accountId} className="body-3 text-muted">
              {sub.assetId}: {sub.balance}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="body-4 text-muted">{sourceLine(status, 1 + subAccountBalances.length)}</span>
    </div>
  );
}

function inferAccountId(id: string) {
  try {
    // preserve if decodeAccountId don't fail
    decodeAccountId(id);
    return id;
  } catch (_error) {
    const splitted = id.split(":");

    const findAndEat = (predicate: (str: string) => unknown) => {
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
        } catch (_error) {
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
