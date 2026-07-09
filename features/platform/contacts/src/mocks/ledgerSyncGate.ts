import type { ContactsMutationAction, LedgerSyncGatePort, LedgerSyncGateResult } from "../contracts";

export function createMockLedgerSyncGatePort(ledgerSyncEnabled: boolean): LedgerSyncGatePort {
  return {
    async checkContactsMutationAllowed(
      action: ContactsMutationAction,
    ): Promise<LedgerSyncGateResult> {
      return ledgerSyncEnabled
        ? { type: "allowed" }
        : { type: "blocked", reason: "ledger-sync-disabled", intendedAction: action };
    },
  };
}
