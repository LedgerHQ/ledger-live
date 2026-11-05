import type {
  AccountReceiveToolAccount,
  AccountReceiveToolAddress,
  AccountReceiveToolProps,
} from "../types";

function AccountReceive({ accounts, onRead, onReadAll }: AccountReceiveToolProps) {
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

function readLabel({ reading, sourceId, readAt }: AccountReceiveToolAccount): string {
  if (reading) return "reading…";
  if (readAt === undefined) return "never read";
  return `${sourceId ?? "?"} · ${new Date(readAt).toLocaleTimeString()}`;
}

function AddressLine({
  label,
  value,
}: Readonly<{ label: string; value: AccountReceiveToolAddress }>) {
  return (
    <div className="flex flex-col gap-2 body-3 font-mono">
      <div className="flex gap-12">
        <span className="text-muted">{label}</span>
        <span className="flex-1 min-w-0 break-all body-3-semi-bold text-success">
          {value.address}
        </span>
      </div>
      <span className="text-muted break-all">
        {value.verification ? `device ${value.verification}` : "no device verification"}
      </span>
    </div>
  );
}

function AccountRow({
  account,
  onRead,
}: Readonly<{ account: AccountReceiveToolAccount; onRead: AccountReceiveToolProps["onRead"] }>) {
  const { accountUUID, descriptor, reading, error, status, receive, shielded } = account;
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
      {status === "onboardingRequired" ? (
        <div className="body-3 text-warning">onboarding required before receiving</div>
      ) : null}
      {receive ? <AddressLine label="receive" value={receive} /> : null}
      {shielded ? <AddressLine label="shielded" value={shielded} /> : null}
    </div>
  );
}

export default AccountReceive;
