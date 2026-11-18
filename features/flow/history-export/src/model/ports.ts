export type HistoryExportAccount = Readonly<{
  id: string;
  name: string;
  formattedBalance: string;
  currency: Readonly<{ id: string; ticker: string }>;
}>;

export type HistoryExportOutcome = "saved" | "canceled" | "failed";

/** What the app gives the export flow: its accounts, their sync, and how it builds and saves the CSV. */
export type HistoryExportPort = Readonly<{
  accounts: readonly HistoryExportAccount[];
  syncAccounts: (accountIds: readonly string[]) => void;
  isSyncing: (accountIds: readonly string[]) => boolean;
  exportCsv: (accountIds: readonly string[]) => Promise<HistoryExportOutcome>;
}>;
