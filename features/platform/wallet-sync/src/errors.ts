export class LedgerSyncMiddlewareMissingError extends Error {
  override name = "LedgerSyncMiddlewareMissingError";
  constructor() {
    super("The store has no Ledger Sync middleware: add createLedgerSyncMiddleware");
  }
}
