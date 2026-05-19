import type { AccountRaw } from "@ledgerhq/types-live";
import type { PortfolioError } from "./types";

type AppJsonShape = {
  data?: {
    // Password-protected exports store `accounts` as an encrypted string blob. Reject those.
    accounts?: Array<{ data: AccountRaw }> | string;
  };
};

export type ParseAppJsonResult = { accountsRaw: AccountRaw[] } | { error: PortfolioError };

export function parseAppJson(text: string): ParseAppJsonResult {
  let parsed: AppJsonShape;
  try {
    parsed = JSON.parse(text) as AppJsonShape;
  } catch (e) {
    return {
      error: {
        kind: "invalid-json",
        message: e instanceof Error ? e.message : "Could not parse the file as JSON.",
      },
    };
  }

  const accounts = parsed?.data?.accounts;

  if (typeof accounts === "string") {
    return {
      error: {
        kind: "encrypted",
        message:
          "This app.json is password-protected. Disable encryption in Ledger Live (Settings → Help → Clear password) and re-export.",
      },
    };
  }

  if (!Array.isArray(accounts)) {
    return {
      error: {
        kind: "missing-accounts",
        message: "No `data.accounts` array found in the dropped file.",
      },
    };
  }

  const accountsRaw: AccountRaw[] = [];
  for (const entry of accounts) {
    if (entry && typeof entry === "object" && entry.data && typeof entry.data === "object") {
      accountsRaw.push(entry.data);
    }
  }

  return { accountsRaw };
}
