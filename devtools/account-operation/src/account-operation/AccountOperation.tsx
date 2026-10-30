import { useState } from "react";
import type {
  AccountOperationToolAccount,
  AccountOperationToolQuery,
  AccountOperationToolProps,
  AccountOperationToolRow,
  AccountOperationToolWindow,
} from "../types";

type OnWindow = (accountUUID: string, queryKey: string) => void;

const FIATS = ["USD", "EUR", "GBP", "JPY", "CHF"];

/** The form's options, the empty ones left out. */
function queryOf(
  limit: string,
  filterAsset: string,
  countervalue: string,
): AccountOperationToolQuery {
  const count = Number.parseInt(limit, 10);
  return {
    ...(count > 0 ? { limit: count } : {}),
    ...(filterAsset.trim() ? { filterAsset: filterAsset.trim() } : {}),
    ...(countervalue.trim() ? { countervalue: countervalue.trim().toUpperCase() } : {}),
  };
}

function AccountOperation({
  accounts,
  assetIds,
  onRead,
  onReadMore,
  onReadAll,
}: AccountOperationToolProps) {
  const [limit, setLimit] = useState("");
  const [filterAsset, setFilterAsset] = useState("");
  const [countervalue, setCountervalue] = useState("");
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex items-center gap-8 flex-shrink-0">
        <span className="flex-1 body-3 text-muted">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
        <input
          aria-label="Limit"
          type="number"
          min={1}
          placeholder="limit"
          value={limit}
          onChange={event => setLimit(event.target.value)}
          className="w-64 font-mono"
        />
        <input
          aria-label="Filter asset"
          list="account-operation-assets"
          placeholder="filter asset"
          value={filterAsset}
          onChange={event => setFilterAsset(event.target.value)}
          className="w-176 font-mono"
        />
        <datalist id="account-operation-assets">
          {assetIds.map(assetId => (
            <option key={assetId} value={assetId}>
              {assetId}
            </option>
          ))}
        </datalist>
        <input
          aria-label="Countervalue"
          list="account-operation-fiats"
          placeholder="countervalue"
          value={countervalue}
          onChange={event => setCountervalue(event.target.value)}
          className="w-96 font-mono"
        />
        <datalist id="account-operation-fiats">
          {FIATS.map(fiat => (
            <option key={fiat} value={fiat}>
              {fiat}
            </option>
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => onReadAll(queryOf(limit, filterAsset, countervalue))}
          className="body-3-semi-bold text-base"
        >
          Read all
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {accounts.length === 0 ? (
          <div className="px-16 py-10 body-3 text-muted">No account in the accounts slice.</div>
        ) : null}
        {accounts.map(account => (
          <AccountRow
            key={account.accountUUID}
            account={account}
            onRead={onRead}
            onReadMore={onReadMore}
          />
        ))}
      </div>
    </div>
  );
}

function readLabel({ reading, sourceId, readAt, rows }: AccountOperationToolWindow): string {
  if (reading) return "reading…";
  if (readAt === undefined) return "never read";
  const count = rows?.length ?? 0;
  return `${count} ${count === 1 ? "operation" : "operations"} · ${sourceId ?? "?"} · ${new Date(readAt).toLocaleTimeString()}`;
}

function AccountRow({
  account,
  onRead,
  onReadMore,
}: Readonly<{ account: AccountOperationToolAccount; onRead: OnWindow; onReadMore: OnWindow }>) {
  const { accountUUID, descriptor, windows } = account;
  return (
    <div className="px-16 py-10 border-b border-base flex flex-col gap-4">
      <details className="min-w-0 body-3-semi-bold text-base font-mono break-all">
        <summary className="cursor-pointer">{accountUUID}</summary>
        {descriptor ? (
          <pre className="body-3 font-mono text-muted whitespace-pre-wrap break-all">
            {descriptor}
          </pre>
        ) : null}
      </details>
      {windows.map(window => (
        <WindowRow
          key={window.queryKey}
          accountUUID={accountUUID}
          window={window}
          onRead={onRead}
          onReadMore={onReadMore}
        />
      ))}
    </div>
  );
}

function WindowRow({
  accountUUID,
  window,
  onRead,
  onReadMore,
}: Readonly<{
  accountUUID: string;
  window: AccountOperationToolWindow;
  onRead: OnWindow;
  onReadMore: OnWindow;
}>) {
  const { queryKey, reading, error, rows, hasMore } = window;
  return (
    <div className="pl-8 flex flex-col gap-4">
      <div className="flex items-center gap-12">
        <span className="flex-1 min-w-0 body-3 font-mono text-muted break-all">{window.label}</span>
        <span className="body-3 text-muted">{readLabel(window)}</span>
        <button
          type="button"
          disabled={reading}
          onClick={() => onRead(accountUUID, queryKey)}
          className="body-3-semi-bold text-base"
        >
          Read
        </button>
      </div>
      {error ? <div className="body-3 text-error">{error}</div> : null}
      {rows?.map(row => (
        <OperationRow key={row.id} row={row} />
      ))}
      {hasMore ? (
        <button
          type="button"
          disabled={reading}
          onClick={() => onReadMore(accountUUID, queryKey)}
          className="self-start body-3-semi-bold text-base"
        >
          Read more
        </button>
      ) : null}
    </div>
  );
}

function statusOf({ pending, failed }: AccountOperationToolRow): string | undefined {
  if (pending) return "pending";
  if (failed) return "failed";
  return undefined;
}

function OperationRow({ row }: Readonly<{ row: AccountOperationToolRow }>) {
  const status = statusOf(row);
  return (
    <details className={`body-3 font-mono ${row.child ? "pl-16" : ""}`}>
      <summary className="cursor-pointer flex gap-12">
        <span className="text-muted">{row.date}</span>
        <span className="text-base">{row.type}</span>
        <span className="flex-1 min-w-0 break-all text-muted">{row.assetId}</span>
        {status ? (
          <span className={row.failed ? "text-error" : "text-warning"}>{status}</span>
        ) : null}
        <span className={row.failed ? "text-muted" : "body-3-semi-bold text-base"}>
          {row.value}
        </span>
        {row.countervalues?.length ? (
          <span className="body-3-semi-bold text-success">{row.countervalues.join(" · ")}</span>
        ) : null}
      </summary>
      <div className="pl-16 text-muted break-all">
        <div>id {row.id}</div>
        <div>hash {row.hash}</div>
        <div>fee {row.fee}</div>
      </div>
    </details>
  );
}

export default AccountOperation;
