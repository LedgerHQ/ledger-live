export class LedgerSyncBackendsMissingError extends Error {
  override name = "LedgerSyncBackendsMissingError";
  constructor(options?: ErrorOptions) {
    super(
      "No valid Ledger Sync backends in the thunk extraArgument: spread `ledgerSyncBackendsExtra(...)` into it",
      options,
    );
  }
}
