import { CardContentDescription, Tag } from "@ledgerhq/lumen-ui-react";
import type { SkippedAccount, SkippedReason } from "../model/types";

type PnlSkippedAccountsListProps = Readonly<{
  /** Accounts that failed to decode (e.g. unsupported currency). */
  decodeFailures: SkippedAccount[];
  /** Decoded accounts that produced no PnL (no countervalue / empty). */
  unsupported: SkippedAccount[];
}>;

export function PnlSkippedAccountsList({
  decodeFailures,
  unsupported,
}: PnlSkippedAccountsListProps) {
  const all = [...decodeFailures, ...unsupported];
  if (all.length === 0) return null;

  return (
    <details className="border-base rounded-12 border px-16 py-12 text-base">
      <summary className="body-2 cursor-pointer select-none">
        Skipped accounts ({all.length})
      </summary>

      <div className="mt-12 flex flex-col gap-12">
        <CardContentDescription>
          These accounts were not included in the totals. Decode failures usually mean the currency
          is not enabled in this build; "no counter-value" means we have no rate for that pair.
        </CardContentDescription>

        <ul className="m-0 flex flex-col gap-8 p-0">
          {all.map(account => (
            <li
              key={`${account.reason}-${account.id}`}
              className="flex flex-wrap items-center gap-12"
            >
              <Tag
                size="sm"
                appearance={appearanceFor(account.reason)}
                label={labelFor(account.reason)}
              />
              <span className="body-3 truncate" title={account.label}>
                {account.label}
              </span>
              {account.detail ? (
                <span className="body-3 text-muted truncate" title={account.detail}>
                  — {account.detail}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function labelFor(reason: SkippedReason): string {
  switch (reason) {
    case "decode-failed":
      return "decode failed";
    case "no-countervalue":
      return "no counter-value";
    case "empty":
      return "empty";
  }
}

function appearanceFor(reason: SkippedReason): "warning" | "error" | "gray" {
  switch (reason) {
    case "decode-failed":
      return "error";
    case "no-countervalue":
      return "warning";
    case "empty":
      return "gray";
  }
}
