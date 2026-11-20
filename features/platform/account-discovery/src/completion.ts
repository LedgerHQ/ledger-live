import type { Observable } from "rxjs";
import { accountDescriptorKey, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { DiscoveredAccount } from "./discoverAccounts";

/** Where one selected account stands in the device step that makes it addable. */
export type AccountCompletionState =
  | { readonly type: "waiting" }
  | { readonly type: "awaiting-approval" }
  | { readonly type: "completed"; readonly descriptor: AccountDescriptor }
  | { readonly type: "refused" }
  | { readonly type: "failed"; readonly error: Error };

/** `source` is the descriptor as discovered: the completed one carries a different key. */
export type AccountCompletionEvent = {
  readonly source: AccountDescriptor;
  readonly state: AccountCompletionState;
};

/** Emits `waiting` for every account, then each one's progress; errors on anything but a refusal, a disconnect included. */
export type CompleteAccounts = (
  selected: readonly AccountDescriptor[],
) => Observable<AccountCompletionEvent>;

/** Keyed by `accountDescriptorKey(source)`, never by the completed descriptor. */
export type CompletionStates = ReadonlyMap<string, AccountCompletionState>;

export type NeedsCompletion = (descriptor: AccountDescriptor) => boolean;

/** Completed or refused: a retry does not prompt it again. */
export const isSettled = (state: AccountCompletionState | undefined): boolean =>
  state?.type === "completed" || state?.type === "refused";

const isPending = (state: AccountCompletionState): boolean =>
  state.type === "waiting" || state.type === "awaiting-approval";

export function completionStates(
  selected: readonly AccountDescriptor[],
  events: readonly AccountCompletionEvent[],
): CompletionStates {
  const states = new Map<string, AccountCompletionState>(
    selected.map(descriptor => [accountDescriptorKey(descriptor), { type: "waiting" }]),
  );
  for (const { source, state } of events) states.set(accountDescriptorKey(source), state);
  return states;
}

/** An attempt's states over the previous ones: an account a previous attempt settled stays settled. */
export function mergeCompletionStates(
  previous: CompletionStates,
  attempt: CompletionStates,
): CompletionStates {
  const merged = new Map(previous);
  for (const [key, state] of attempt) {
    if (!isSettled(merged.get(key))) merged.set(key, state);
  }
  return merged;
}

/** The batch stopped on `error`: the accounts it had not settled fail with it, the settled ones stay. */
export function failPending(states: CompletionStates, error: Error): CompletionStates {
  return new Map(
    [...states].map(([key, state]) => [key, isPending(state) ? { type: "failed", error } : state]),
  );
}

/** The user stopped the batch: the accounts it had not settled are no longer part of it. */
export function dropPending(states: CompletionStates): CompletionStates {
  return new Map([...states].filter(([, state]) => !isPending(state)));
}

export function completedDescriptors(states: CompletionStates): readonly AccountDescriptor[] {
  return [...states.values()].flatMap(state =>
    state.type === "completed" ? [state.descriptor] : [],
  );
}

/** Splits a selection on data only: the flow never names a family. */
export function splitSelection(
  selected: readonly DiscoveredAccount[],
  needsCompletion: NeedsCompletion,
): {
  readonly ready: readonly DiscoveredAccount[];
  readonly needsComplete: readonly DiscoveredAccount[];
} {
  const ready: DiscoveredAccount[] = [];
  const needsComplete: DiscoveredAccount[] = [];
  for (const account of selected) {
    (needsCompletion(account.descriptor) ? needsComplete : ready).push(account);
  }
  return { ready, needsComplete };
}
