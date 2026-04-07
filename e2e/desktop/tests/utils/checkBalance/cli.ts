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
          return { balance: String(sub.balance), freshAddress: String(parsed.freshAddress ?? "") };
        }
        continue;
      }

      return { balance: String(parsed.balance), freshAddress: String(parsed.freshAddress ?? "") };
    } catch {
      // not valid JSON — keep scanning
    }
  }
  return null;
}
