import React from "react";
import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { AccountBalanceRow, AccountBalancesToolProps, StoredBalance } from "../types";
import { formatAmount, statusLine } from "./AccountBalances.internals";

function TokenRow({ token }: Readonly<{ token: StoredBalance }>) {
  return (
    <li className="flex items-baseline justify-between gap-16 py-2">
      <span className="body-4 text-muted truncate" title={token.assetId}>
        {token.assetId}
      </span>
      <span className="body-4 tabular-nums whitespace-nowrap">
        {formatAmount(token.value, token.unit)}
      </span>
    </li>
  );
}

function Row({ row, onRead }: Readonly<{ row: AccountBalanceRow; onRead: () => void }>) {
  const spendableDiffers = row.balance !== undefined && row.balance.spendable !== row.balance.value;

  return (
    <div className="flex flex-col gap-8 py-16">
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-8 flex-wrap">
            <span className="body-2-semi-bold truncate">{row.name}</span>
            <Tag size="sm" label={row.currencyId} />
            {row.granular ? (
              <Tag size="sm" appearance="success" label="granular" />
            ) : (
              <Tag size="sm" appearance="gray" label="full sync only" />
            )}
          </div>
          <code className="body-4 text-muted truncate" title={row.address}>
            {row.address}
          </code>
        </div>

        <div className="flex items-center gap-12 shrink-0">
          <div className="flex flex-col items-end gap-4">
            <span className="body-1-semi-bold tabular-nums whitespace-nowrap">
              {row.balance ? formatAmount(row.balance.value, row.balance.unit) : "—"}
            </span>
            {spendableDiffers && row.balance ? (
              <span className="body-4 text-muted tabular-nums whitespace-nowrap">
                {`spendable ${formatAmount(row.balance.spendable, row.balance.unit)}`}
              </span>
            ) : null}
          </div>
          <Button size="sm" onClick={onRead} disabled={row.status.pending}>
            {row.status.pending ? "Reading…" : "Read balance"}
          </Button>
        </div>
      </div>

      <span className={`body-4 ${row.status.error ? "text-error" : "text-muted"}`}>
        {statusLine(row)}
      </span>

      {row.tokens.length > 0 ? (
        <ul className="list-none p-0 m-0 flex flex-col border-l border-base pl-12">
          {row.tokens.map(token => (
            <TokenRow key={token.assetId} token={token} />
          ))}
          <li className="body-4 text-muted pt-4">
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
    <div className="flex flex-col gap-16 overflow-y-auto p-16">
      <p className="body-3 text-muted m-0">
        Reads go through <code>@features/platform-account-data</code>, asking for the balance and
        nothing else. <strong>granular</strong> means a coin module serves it directly;{" "}
        <strong>full sync only</strong> means it falls back to <code>AccountBridge.sync()</code>,
        which costs the same as today.
      </p>

      {ready ? null : (
        <p className="body-3 text-warning m-0">
          No source is registered in this host, so a read can only report that nothing can serve the
          account.
        </p>
      )}

      <div className="flex items-center gap-12 flex-wrap">
        <Button size="sm" onClick={onReadAll} disabled={!ready || accounts.length === 0}>
          Read all
        </Button>
        <span className="body-4 text-muted">
          respects freshness, like a portfolio mount · {accounts.length} account
          {accounts.length === 1 ? "" : "s"}
        </span>
      </div>

      <Divider />

      {accounts.length === 0 ? (
        <p className="body-3 text-muted m-0">No accounts in this profile.</p>
      ) : (
        <div className="flex flex-col">
          {accounts.map((row, index) => (
            <React.Fragment key={row.accountId}>
              {index > 0 ? <Divider /> : null}
              <Row row={row} onRead={() => onRead(row.accountId)} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountBalances;
