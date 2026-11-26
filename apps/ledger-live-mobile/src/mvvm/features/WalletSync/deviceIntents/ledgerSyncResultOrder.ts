import { createLedgerSyncResultOrder } from "@features/platform-key-ring";

/** The app's one Ledger Sync result order, shared by every add member and remove member run. */
export const ledgerSyncResultOrder = createLedgerSyncResultOrder();
