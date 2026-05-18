import type { Account, AccountRaw } from "@ledgerhq/types-live";
// Use the framework-level deserializer (no bridge required). `@ledgerhq/live-common`'s
// fromAccountRaw calls `getAccountBridgeByFamily` which throws in `web-tools` (no bridges
// are registered there). The framework-level variant only needs `getCryptoCurrencyById`
// and the cryptoassets store, both already initialized in live-common-setup.ts.
import { fromAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization";
import { shortId } from "./labels";
import type { DecodeResult, SkippedAccount } from "./types";

export async function decodeAccounts(rawAccounts: AccountRaw[]): Promise<DecodeResult> {
  const settled = await Promise.allSettled(rawAccounts.map(raw => fromAccountRaw(raw)));

  const accounts: Account[] = [];
  const namesById = new Map<string, string>();
  const failures: SkippedAccount[] = [];

  settled.forEach((result, idx) => {
    const raw = rawAccounts[idx];
    if (result.status === "fulfilled") {
      accounts.push(result.value);
      if (raw?.name) namesById.set(result.value.id, raw.name);
    } else {
      failures.push({
        reason: "decode-failed",
        id: raw?.id ?? `unknown-${idx}`,
        label: rawAccountLabel(raw, idx),
        detail: decodeFailureDetail(result.reason),
      });
    }
  });

  return { accounts, namesById, failures };
}

function decodeFailureDetail(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return "Unknown decode error";
}

function rawAccountLabel(raw: AccountRaw | undefined, idx: number): string {
  if (!raw) return `account #${idx + 1}`;
  if (raw.name) return raw.name;
  return `${raw.currencyId} ${shortId(raw.id)}`;
}
