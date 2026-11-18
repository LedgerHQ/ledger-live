import type { AccountId } from "@domain/entity-account";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";

export type HistoryExportAccount = Readonly<{
  id: AccountId;
  name: string;
  formattedBalance: string;
  currency: Readonly<{ id: CryptoOrTokenCurrencyId; ticker: string }>;
}>;

export type HistoryExportOutcome = "saved" | "canceled" | "failed";

/** What the app gives the export flow: its accounts, their sync, and how it builds and saves the CSV. */
export type HistoryExportPort = Readonly<{
  accounts: readonly HistoryExportAccount[];
  syncAccounts: (accountIds: readonly AccountId[]) => void;
  isSyncing: (accountIds: readonly AccountId[]) => boolean;
  exportCsv: (accountIds: readonly AccountId[]) => Promise<HistoryExportOutcome>;
}>;
