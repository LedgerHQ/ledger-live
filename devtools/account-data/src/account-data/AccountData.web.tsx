import React, { useEffect, useState } from "react";
import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { AccountDataRow, AccountDataToolProps, ReadStatus } from "../types";
import { statusLine } from "./AccountData.internals";

type RowProps = Readonly<{
  row: AccountDataRow;
  now: number;
  onReadBalance: () => void;
  onReadOperations: () => void;
  onLoadMoreOperations: () => void;
}>;

/** The current time, ticking every second while `ticking`, so read ages move on an idle tool. */
function useNow(ticking: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [ticking]);
  return now;
}

function Status({
  store,
  status,
  now,
}: Readonly<{ store: string; status: ReadStatus | undefined; now: number }>) {
  return (
    <span className={`body-4 ${status?.error ? "text-error" : "text-muted"}`}>
      <code>{store}</code> {statusLine(status, now)}
    </span>
  );
}

function Balances({ rows }: Readonly<{ rows: AccountDataRow["balances"] }>) {
  if (!rows) return <span className="body-4 text-muted">accountBalances: nothing stored</span>;
  return (
    <table className="w-full body-4 tabular-nums">
      <thead className="text-muted">
        <tr>
          <th className="text-left font-normal">assetId</th>
          <th className="text-right font-normal">balance</th>
          <th className="text-right font-normal">spendableBalance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.assetId}>
            <td className="truncate" title={row.assetId}>
              {row.assetId}
            </td>
            <td className="text-right whitespace-nowrap">{row.balance}</td>
            <td className="text-right whitespace-nowrap">{row.spendableBalance}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Operations({
  row,
  onLoadMore,
}: Readonly<{ row: AccountDataRow; onLoadMore: () => void }>) {
  const { operations, operationsTotal, operationsStatus } = row;
  if (!operations)
    return <span className="body-4 text-muted">accountOperations: nothing stored</span>;
  return (
    <div className="flex flex-col gap-4">
      <ul className="list-none p-0 m-0 flex flex-col border-l border-base pl-12">
        {operations.map(operation => (
          <li key={operation.id} className="flex justify-between gap-16 body-4 tabular-nums">
            <span className="text-muted whitespace-nowrap">{operation.date}</span>
            <span>
              {operation.type}
              {operation.hasFailed ? " (failed)" : ""}
            </span>
            <span className="truncate">{operation.assetId}</span>
            <span className="truncate" title={operation.hash}>
              {operation.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-12">
        <span className="body-4 text-muted">
          {operations.length}
          {operationsTotal === undefined ? "" : ` of ${operationsTotal}`} operations
        </span>
        {operationsStatus?.nextCursor === undefined ? null : (
          <Button size="sm" onClick={onLoadMore} disabled={operationsStatus.pending}>
            Load more
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ row, now, onReadBalance, onReadOperations, onLoadMoreOperations }: RowProps) {
  return (
    <div className="flex flex-col gap-8 py-16">
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-8 flex-wrap">
            <code className="body-2-semi-bold truncate">{row.accountUUID}</code>
            <Tag size="sm" label={row.network} />
          </div>
          <code className="body-4 text-muted truncate" title={row.key}>
            {row.key} · {row.path}
          </code>
          {row.legacyId === undefined ? null : (
            <code className="body-4 text-muted truncate" title={row.legacyId}>
              legacyId {row.legacyId}
            </code>
          )}
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <Button size="sm" onClick={onReadBalance} disabled={row.balanceStatus?.pending}>
            Read balance
          </Button>
          <Button size="sm" onClick={onReadOperations} disabled={row.operationsStatus?.pending}>
            Read operations
          </Button>
        </div>
      </div>

      <Status store="accountData.balance" status={row.balanceStatus} now={now} />
      <Balances rows={row.balances} />

      <Status store="accountData.operations" status={row.operationsStatus} now={now} />
      <Operations row={row} onLoadMore={onLoadMoreOperations} />
    </div>
  );
}

function AccountData(props: Readonly<AccountDataToolProps>) {
  const { accounts, onReadBalance, onReadOperations, onLoadMoreOperations, onReadAll } = props;
  const now = useNow(
    accounts.some(
      row => row.balanceStatus?.readAt !== undefined || row.operationsStatus?.readAt !== undefined,
    ),
  );
  return (
    <div className="flex flex-col gap-16 overflow-y-auto p-16">
      <p className="body-3 text-muted m-0">
        One row per entry of the accounts slice, with what <code>accountData</code>,{" "}
        <code>accountBalances</code> and <code>accountOperations</code> hold for it, as stored.
        Reads go through <code>@domain/api-account-data</code>: the first ranked source that serves
        the account answers.
      </p>

      <div className="flex items-center gap-12 flex-wrap">
        <Button size="sm" onClick={onReadAll} disabled={accounts.length === 0}>
          Read all balances
        </Button>
        <span className="body-4 text-muted">
          respects freshness, like a portfolio mount · {accounts.length} account
          {accounts.length === 1 ? "" : "s"}
        </span>
      </div>

      <Divider />

      {accounts.length === 0 ? (
        <p className="body-3 text-muted m-0">The accounts slice is empty.</p>
      ) : (
        <div className="flex flex-col">
          {accounts.map((row, index) => (
            <React.Fragment key={row.accountUUID}>
              {index > 0 ? <Divider /> : null}
              <Row
                row={row}
                now={now}
                onReadBalance={() => onReadBalance(row.accountUUID)}
                onReadOperations={() => onReadOperations(row.accountUUID)}
                onLoadMoreOperations={() => onLoadMoreOperations(row.accountUUID)}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountData;
