import type { AccountBalanceToolAccount, AccountBalanceToolProps } from "../types";

function AccountBalance({ accounts, onRead, onReadAll }: AccountBalanceToolProps) {
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
          <AccountRow key={account.accountUUID} account={account} onRead={onRead} />
        ))}
      </div>
    </div>
  );
}

function readLabel({ reading, sourceId, readAt }: AccountBalanceToolAccount): string {
  if (reading) return "reading…";
  if (readAt === undefined) return "never read";
  return `${sourceId ?? "?"} · ${new Date(readAt).toLocaleTimeString()}`;
}

function AccountRow({
  account,
  onRead,
}: Readonly<{ account: AccountBalanceToolAccount; onRead: (accountUUID: string) => void }>) {
  const { accountUUID, descriptor, reading, error, rows } = account;
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
        <div key={row.assetId} className="flex gap-12 body-3 font-mono">
          <span className={`flex-1 min-w-0 break-all ${row.empty ? "text-muted" : "text-base"}`}>
            {row.assetId}
          </span>
          {row.spendableBalance === undefined ? null : (
            <span className="text-muted">spendable {row.spendableBalance}</span>
          )}
          <span className={row.empty ? "text-muted" : "body-3-semi-bold text-success"}>
            {row.balance}
          </span>
        </div>
      ))}
    </div>
  );
}

export default AccountBalance;
