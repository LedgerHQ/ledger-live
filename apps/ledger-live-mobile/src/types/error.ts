export type LedgerError = Error & {
  [key: string]: unknown;
  managerAppName?: string;
};
