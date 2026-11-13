import { useState, type FormEvent } from "react";
import type {
  AccountStatusToolAccount,
  AccountStatusToolAsset,
  AccountStatusToolProps,
  AccountStatusToolRead,
} from "../types";

type OnReadAsset = AccountStatusToolProps["onReadAsset"];

const lastRead = ({ reading, sourceId, readAt }: AccountStatusToolRead): string => {
  if (reading) return "reading…";
  if (readAt === undefined) return "never read";
  return `${sourceId ?? "?"} · ${new Date(readAt).toLocaleTimeString()}`;
};

const usedLabel = (used: boolean | undefined) => {
  if (used === undefined) return "";
  return used ? "yes" : "no";
};

const cell = "px-8 py-6 align-top";

function AssetLine({ asset }: Readonly<{ asset: AccountStatusToolAsset }>) {
  return (
    <tr className="text-muted">
      <td colSpan={2} className={`${cell} pl-24 break-all`}>
        {asset.assetId}
      </td>
      <td className={cell}>{asset.gate}</td>
      <td className={cell}>{asset.receiveGate && `receive: ${asset.receiveGate}`}</td>
      <td colSpan={2} className={cell}>
        {asset.error && !asset.reading ? (
          <span className="text-error">{asset.error}</span>
        ) : (
          lastRead(asset)
        )}
      </td>
    </tr>
  );
}

function AssetInput({
  accountUUID,
  onReadAsset,
}: Readonly<{ accountUUID: string; onReadAsset: OnReadAsset }>) {
  const [assetId, setAssetId] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = assetId.trim();
    if (trimmed) onReadAsset(accountUUID, trimmed);
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-8 pl-16">
      <input
        aria-label="Asset id"
        value={assetId}
        onChange={event => setAssetId(event.target.value)}
        placeholder="asset id, e.g. ethereum/erc20/usd__coin"
        className="flex-1 min-w-0 body-3 font-mono bg-transparent border border-base rounded-xs px-8 py-4"
      />
      <button type="submit" className="body-3-semi-bold text-base">
        Read asset
      </button>
    </form>
  );
}

function AccountLines({
  account,
  onRead,
  onReadAsset,
}: Readonly<{
  account: AccountStatusToolAccount;
  onRead: AccountStatusToolProps["onRead"];
  onReadAsset: OnReadAsset;
}>) {
  return (
    <>
      <tr className="border-t border-base">
        <td className={`${cell} break-all`}>
          <details>
            <summary className="cursor-pointer">{account.accountUUID}</summary>
            {account.descriptor ? (
              <pre className="body-3 font-mono text-muted whitespace-pre-wrap break-all">
                {account.descriptor}
              </pre>
            ) : null}
          </details>
        </td>
        <td className={cell}>{usedLabel(account.used)}</td>
        <td className={cell}>{account.gate}</td>
        <td className={cell}>{account.sendGate && `send: ${account.sendGate}`}</td>
        <td className={cell}>
          {account.error && !account.reading ? (
            <span className="text-error">{account.error}</span>
          ) : (
            lastRead(account)
          )}
        </td>
        <td className={cell}>
          <button
            type="button"
            disabled={account.reading}
            onClick={() => onRead(account.accountUUID)}
            className="body-3-semi-bold text-base"
          >
            Read
          </button>
        </td>
      </tr>
      {account.assets.map(asset => (
        <AssetLine key={asset.assetId} asset={asset} />
      ))}
      <tr>
        <td colSpan={6} className="px-8 pb-8">
          <AssetInput accountUUID={account.accountUUID} onReadAsset={onReadAsset} />
        </td>
      </tr>
    </>
  );
}

function AccountStatus({ accounts, onRead, onReadAll, onReadAsset }: AccountStatusToolProps) {
  const count = `${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`;
  return (
    <section className="flex flex-col h-full overflow-y-auto select-text body-3 font-mono">
      <header className="sticky top-0 bg-canvas px-16 py-8 flex gap-16 items-center">
        <span className="text-muted">{count}</span>
        <button type="button" onClick={onReadAll} className="body-3-semi-bold text-base">
          Read all
        </button>
      </header>
      {accounts.length === 0 ? (
        <p className="px-16 text-muted">No account in the accounts slice.</p>
      ) : (
        <table className="w-full">
          <thead className="text-muted text-left">
            <tr>
              <th className={cell}>account</th>
              <th className={cell}>used</th>
              <th className={cell}>gate</th>
              <th className={cell}>blocks</th>
              <th className={cell}>last read</th>
              <th className={cell}>actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <AccountLines
                key={account.accountUUID}
                account={account}
                onRead={onRead}
                onReadAsset={onReadAsset}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default AccountStatus;
