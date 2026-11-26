import { hashKey, type QueryKey } from "@tanstack/react-query";

/** `useLedgerSyncBackends` ran on a store built without `ledgerSyncBackendsExtra`. */
export class LedgerSyncBackendsMissingError extends Error {
  override name = "LedgerSyncBackendsMissingError";
  constructor(options?: ErrorOptions) {
    super(
      "No valid Ledger Sync backends in the thunk extraArgument: spread `ledgerSyncBackendsExtra(...)` into it",
      options,
    );
  }
}

/**
 * The members query ran without a member key, so it resolved no members: only a manual `refetch`
 * runs it then. It keeps the name and message the query library gives a query that resolves
 * nothing, so logs and screens read it as before; recognize it with `instanceof`.
 */
export class LedgerSyncMembersUnresolvedError extends Error {
  override name = "Error";
  constructor(queryKey: QueryKey) {
    super(`${hashKey(queryKey)} data is undefined`);
  }
}
