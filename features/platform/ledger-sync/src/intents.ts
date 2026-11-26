import {
  createLedgerSyncResultOrder,
  type AddMemberIntentInput,
  type KeyRingClient,
  type KeyRingMember,
  type KeyRingSession,
  type LedgerSyncResultOrder,
  type RemoveMemberIntentInput,
} from "@features/platform-key-ring";

/**
 * The one Ledger Sync result order of the process, shared by every add member and remove member
 * run. The input builders below pass it; pass it yourself only to a tool that builds its own input.
 */
export const ledgerSyncResultOrder: LedgerSyncResultOrder = createLedgerSyncResultOrder();

/**
 * The input of the add member intent, with the shared result order. `allowTreeCreation` is left
 * out when undefined, so the job keeps its default.
 *
 * @example
 * ```ts
 * createIntent(addMemberIntentLWMDefinition, buildAddMemberIntentInput({ session, client }), {
 *   onResult: activation => onResult(activation, session),
 * });
 * ```
 */
export function buildAddMemberIntentInput({
  session,
  client,
  allowTreeCreation,
}: Readonly<{
  session: KeyRingSession;
  client: KeyRingClient;
  allowTreeCreation?: boolean;
}>): AddMemberIntentInput {
  return {
    session,
    client,
    resultOrder: ledgerSyncResultOrder,
    ...(allowTreeCreation !== undefined && { allowTreeCreation }),
  };
}

/** The input of the remove member intent, with the shared result order. */
export function buildRemoveMemberIntentInput({
  session,
  member,
  client,
}: Readonly<{
  session: KeyRingSession;
  member: KeyRingMember;
  client: KeyRingClient;
}>): RemoveMemberIntentInput {
  return { session, member, client, resultOrder: ledgerSyncResultOrder };
}
