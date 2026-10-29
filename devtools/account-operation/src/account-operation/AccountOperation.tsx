import type {
  AccountOperationToolAccount,
  AccountOperationToolProps,
  AccountOperationToolRow,
} from "../types";

function AccountOperation({ accounts, onRead, onReadMore, onReadAll }: AccountOperationToolProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex items-center justify-between flex-shrink-0">
        <span className="body-3 text-muted">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
        <button type="button" onClick={onReadAll} className="body-3-semi-bold text-base">
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

function readLabel({ reading, sourceId, readAt, rows }: AccountOperationToolAccount): string {
  if (reading) return "reading…";
  if (readAt === undefined) return "never read";
  const count = rows?.length ?? 0;
  return `${count} ${count === 1 ? "operation" : "operations"} · ${sourceId ?? "?"} · ${new Date(readAt).toLocaleTimeString()}`;
}

function AccountRow({
  account,
  onRead,
  onReadMore,
}: Readonly<{
  account: AccountOperationToolAccount;
  onRead: (accountUUID: string) => void;
  onReadMore: (accountUUID: string) => void;
}>) {
  const { accountUUID, descriptor, reading, error, rows, hasMore } = account;
  return (
    <div className="px-16 py-10 border-b border-base flex flex-col gap-4">
      <div className="flex items-center gap-12">
        <details className="flex-1 min-w-0 body-3-semi-bold text-base font-mono break-all">
          <summary className="cursor-pointer">{accountUUID}</summary>
          {descriptor ? (
            <pre className="body-3 font-mono text-muted whitespace-pre-wrap break-all">
              {descriptor}
            </pre>
          ) : null}
        </details>
        <span className="body-3 text-muted">{readLabel(account)}</span>
        <button
          type="button"
          disabled={reading}
          onClick={() => onRead(accountUUID)}
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
          onClick={() => onReadMore(accountUUID)}
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
