export type ContactsMutationAction =
  | "create-contact"
  | "add-address"
  | "rename-contact"
  | "edit-address";

export type LedgerSyncGateResult =
  | Readonly<{
      type: "allowed";
    }>
  | Readonly<{
      type: "blocked";
      reason: "ledger-sync-disabled";
      intendedAction: ContactsMutationAction;
    }>;

export type LedgerSyncGatePort = Readonly<{
  checkContactsMutationAllowed(action: ContactsMutationAction): Promise<LedgerSyncGateResult>;
}>;
