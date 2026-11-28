import type { AccountId } from "@domain/entity-account";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";

export type HistoryExportAccount = Readonly<{
  id: AccountId;
  name: string;
  formattedBalance: string;
  currency: Readonly<{ id: CryptoOrTokenCurrencyId; ticker: string }>;
}>;

export type HistoryExportOutcome = "saved" | "canceled" | "failed";

/** What the app gives the export flow: its accounts, and how it reads, builds and saves their CSV. */
export type HistoryExportPort = Readonly<{
  accounts: readonly HistoryExportAccount[];
  /** Reads the operations of the accounts again before writing them: the CSV is never stale. */
  exportCsv: (accountIds: readonly AccountId[]) => Promise<HistoryExportOutcome>;
}>;
