import { useState, type FormEvent } from "react";
import type {
  AccountReceiveToolAccount,
  AccountReceiveToolAddress,
  AccountReceiveToolAsset,
  AccountReceiveToolProps,
} from "../types";

type OnRead = AccountReceiveToolProps["onRead"];

const STATUS_NOTICE: Partial<Record<NonNullable<AccountReceiveToolAsset["status"]>, string>> = {
  onboardingRequired: "onboarding required before receiving",
  assetActivationRequired: "asset activation required before receiving",
};

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

function readLabel({ reading, sourceId, readAt }: AccountReceiveToolAsset): string {
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
        {value.onVerify ? (
          <button type="button" onClick={value.onVerify} className="body-3-semi-bold text-base">
            Verify
          </button>
        ) : null}
      </div>
      <span className="text-muted break-all">
        {value.verification ? `device ${value.verification}` : "no device verification"}
      </span>
      {value.verifyOutcome ? (
        <span className="break-all text-base">{value.verifyOutcome}</span>
      ) : null}
    </div>
  );
}

function AssetRow({
  accountUUID,
  asset,
  onRead,
}: Readonly<{ accountUUID: string; asset: AccountReceiveToolAsset; onRead: OnRead }>) {
  const { assetId, reading, error, status, receive, shielded } = asset;
  const notice = status && STATUS_NOTICE[status];
  return (
    <div className="flex flex-col gap-4 pl-12 border-l border-base">
      <div className="flex items-center gap-12">
        <span className="flex-1 min-w-0 body-3-semi-bold text-base font-mono break-all">
          {assetId}
        </span>
        <span className="body-3 text-muted">{readLabel(asset)}</span>
        <button
          type="button"
          disabled={reading}
          onClick={() => onRead(accountUUID, assetId)}
          className="body-3-semi-bold text-base"
        >
          Read
        </button>
      </div>
      {error ? <div className="body-3 text-error">{error}</div> : null}
      {notice ? <div className="body-3 text-warning">{notice}</div> : null}
      {receive ? <AddressLine label="receive" value={receive} /> : null}
      {shielded ? <AddressLine label="shielded" value={shielded} /> : null}
    </div>
  );
}

function TokenReadForm({ accountUUID, onRead }: Readonly<{ accountUUID: string; onRead: OnRead }>) {
  const [assetId, setAssetId] = useState("");
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = assetId.trim();
    if (trimmed) onRead(accountUUID, trimmed);
  };
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-12">
      <input
        aria-label="token id"
        value={assetId}
        onChange={event => setAssetId(event.target.value)}
        placeholder="token id, e.g. ethereum/erc20/usd__coin"
        className="flex-1 min-w-0 body-3 font-mono bg-transparent border-b border-base"
      />
      <button type="submit" className="body-3-semi-bold text-base">
        Read token
      </button>
    </form>
  );
}

function AccountRow({
  account,
  onRead,
}: Readonly<{ account: AccountReceiveToolAccount; onRead: OnRead }>) {
  const { accountUUID, descriptor, assets } = account;
  return (
    <div className="px-16 py-10 border-b border-base flex flex-col gap-8">
      <details className="body-3-semi-bold text-base font-mono break-all">
        <summary className="cursor-pointer">{accountUUID}</summary>
        {descriptor ? (
          <pre className="body-3 font-mono text-muted whitespace-pre-wrap break-all">
            {descriptor}
          </pre>
        ) : null}
      </details>
      {assets.map(asset => (
        <AssetRow key={asset.assetId} accountUUID={accountUUID} asset={asset} onRead={onRead} />
      ))}
      <TokenReadForm accountUUID={accountUUID} onRead={onRead} />
    </div>
  );
}

export default AccountReceive;
