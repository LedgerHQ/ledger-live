import React from "react";
import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { AccountBalanceRow, AccountBalancesToolProps, StoredBalance } from "../types";

/** Seconds since a timestamp, or `undefined` when there is nothing to age. */
function ageSeconds(at: string | number | undefined): number | undefined {
  if (at === undefined) return undefined;
  const ms = typeof at === "number" ? at : new Date(at).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round((Date.now() - ms) / 1000)) : undefined;
}

function Amounts({ balance }: Readonly<{ balance: StoredBalance }>) {
  return (
    <span className="flex flex-col">
      <span className="font-mono">{balance.value}</span>
      {balance.spendable === balance.value ? null : (
        <span className="font-mono opacity-60">spendable {balance.spendable}</span>
      )}
    </span>
  );
}

function Row({ row, onRead }: Readonly<{ row: AccountBalanceRow; onRead: () => void }>) {
  const age = ageSeconds(row.balance?.at);

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-semibold">{row.name}</span>
        <Tag label={row.currencyId} />
        {row.granular ? (
          <Tag appearance="success" label="granular" />
        ) : (
          <Tag appearance="gray" label="full sync only" />
        )}
        <span className="flex-1" />
        <Button size="sm" onClick={onRead} disabled={row.status.pending}>
          {row.status.pending ? "Reading…" : "Read balance"}
        </Button>
      </div>

      <div className="flex items-start gap-4 flex-wrap">
        {row.balance ? <Amounts balance={row.balance} /> : <span className="opacity-60">—</span>}
        <span className="flex flex-col opacity-70">
          {row.status.error ? (
            <span className="text-error">{row.status.error}</span>
          ) : (
            <span>
              {row.status.sourceId
                ? `served by ${row.status.sourceId}`
                : "not read by the layer yet"}
              {age === undefined ? "" : ` · observed ${age}s ago`}
            </span>
          )}
          <span className="font-mono opacity-70 break-all">{row.address}</span>
        </span>
      </div>

      {row.tokens.length > 0 ? (
        <ul className="list-none p-0 m-0 flex flex-col gap-1 pl-4">
          {row.tokens.map(token => (
            <li key={token.assetId} className="flex gap-2 opacity-80">
              <span className="font-mono">{token.assetId}</span>
              <span className="font-mono">{token.value}</span>
            </li>
          ))}
          <li className="opacity-60">
            {row.tokens.length + 1} assets came back from the same read
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export function AccountBalances(props: Readonly<AccountBalancesToolProps>) {
  const { accounts, onRead, onReadAll, ready } = props;

  return (
    <div className="flex flex-col overflow-y-auto gap-2">
      <p className="opacity-70">
        Reads go through <code>@features/platform-account-data</code>, asking for the{" "}
        <code>balance</code> slice and nothing else. <strong>granular</strong> means a coin module
        can serve it in one call; <strong>full sync only</strong> means the router falls back to
        <code> AccountBridge.sync()</code>, which costs the same as today.
      </p>

      {ready ? null : (
        <p className="text-warning">
          No scheduler is wired in this host, so reads do nothing. What you see below is whatever a
          background sync has already mirrored into the balance table.
        </p>
      )}

      <div className="flex gap-2 items-center flex-wrap">
        <Button size="sm" onClick={onReadAll} disabled={!ready || accounts.length === 0}>
          Read all (respects freshness)
        </Button>
        <span className="opacity-60">
          {accounts.length} account{accounts.length === 1 ? "" : "s"}
        </span>
      </div>

      <Divider />

      {accounts.length === 0 ? (
        <p className="opacity-60">No accounts in this profile.</p>
      ) : (
        accounts.map(row => (
          <div key={row.accountId}>
            <Row row={row} onRead={() => onRead(row.accountId)} />
            <Divider />
          </div>
        ))
      )}
    </div>
  );
}

export default AccountBalances;
