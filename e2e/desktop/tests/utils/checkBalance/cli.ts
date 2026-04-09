import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export function buildCliCmd(account: Account): string {
  const parts = [
    "sync",
    "--currency",
    account.currency.id,
    "--index",
    String(account.index),
    "--length",
    "1",
    "--format",
    "json",
  ];
  if (account.derivationMode) {
    parts.push("--scheme", account.derivationMode);
  }
  return parts.join("+");
}

function toStr(val: unknown, fallback = ""): string {
  return typeof val === "string" || typeof val === "number" ? String(val) : fallback;
}

export function parseCliOutput(
  output: string,
  tokenId?: string,
): { balance: string; freshAddress: string } | null {
  const lines = output.trim().split("\n").filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]) as Record<string, unknown>;
      if (parsed.balance === undefined) continue;

      if (tokenId) {
        const subAccounts = parsed.subAccounts as Array<Record<string, unknown>> | undefined;
        const sub = subAccounts?.find(sa => sa.tokenId === tokenId);
        if (sub?.balance !== undefined) {
          return {
            balance: toStr(sub.balance, "0"),
            freshAddress: toStr(parsed.freshAddress),
          };
        }
        continue;
      }

      return {
        balance: toStr(parsed.balance, "0"),
        freshAddress: toStr(parsed.freshAddress),
      };
    } catch {
      // not valid JSON — keep scanning
    }
  }
  return null;
}
