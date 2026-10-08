import type { PendingUnshield } from "@ledgerhq/coin-evm/confidential";

/**
 * An unshield signed in this session and not finalized yet. `pending` is read from the phase-1
 * receipt once it is mined; until then only the request hash is known.
 */
export type SessionUnshield = {
  requestTxHash: string;
  /** Wrapper units, as `PendingUnshield.amount`. */
  amount: bigint;
  pending?: PendingUnshield;
};

const unshields = new Map<string, SessionUnshield>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

export const getSessionUnshield = (tokenAccountId: string): SessionUnshield | undefined =>
  unshields.get(tokenAccountId);

/** One unshield followed per token account: a newer request replaces the previous one. */
export const setSessionUnshield = (tokenAccountId: string, entry: SessionUnshield): void => {
  unshields.set(tokenAccountId, entry);
  notify();
};

export const clearSessionUnshield = (tokenAccountId: string): void => {
  unshields.delete(tokenAccountId);
  notify();
};

export const subscribeSessionUnshields = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
