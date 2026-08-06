import { useCallback, useState } from "react";
import type { ContactId } from "@domain/entity-contact";
import type { ContactsLedgerSyncStatus } from "@features/flow-contacts-introduction";

export type ContactsLedgerSyncMutationIntent =
  | Readonly<{ kind: "addContact" }>
  | Readonly<{ kind: "addAddress"; contactId: ContactId }>;

export type ContactsLedgerSyncMutationRequest =
  | Readonly<{ status: "allowed"; intent: ContactsLedgerSyncMutationIntent }>
  | Readonly<{ status: "blocked"; intent: ContactsLedgerSyncMutationIntent }>
  | Readonly<{ status: "checking" }>
  | Readonly<{ status: "unavailable" }>;

export function useContactsLedgerSyncMutationGuard() {
  const [pendingIntent, setPendingIntent] = useState<ContactsLedgerSyncMutationIntent>();

  const requestMutation = useCallback(
    (
      intent: ContactsLedgerSyncMutationIntent,
      ledgerSyncStatus: ContactsLedgerSyncStatus,
    ): ContactsLedgerSyncMutationRequest => {
      if (ledgerSyncStatus === "ready") {
        return { status: "allowed", intent };
      }

      if (ledgerSyncStatus === "checking") {
        setPendingIntent(undefined);
        return { status: "checking" };
      }

      if (ledgerSyncStatus === "unavailable") {
        setPendingIntent(undefined);
        return { status: "unavailable" };
      }

      setPendingIntent(intent);
      return { status: "blocked", intent };
    },
    [],
  );

  const consumePendingIntent = useCallback(
    (ledgerSyncStatus: ContactsLedgerSyncStatus) => {
      if (ledgerSyncStatus !== "ready" || !pendingIntent) {
        return undefined;
      }

      setPendingIntent(undefined);
      return pendingIntent;
    },
    [pendingIntent],
  );

  const dismissPendingIntent = useCallback(() => setPendingIntent(undefined), []);

  return {
    pendingIntent,
    requestMutation,
    consumePendingIntent,
    dismissPendingIntent,
  };
}
