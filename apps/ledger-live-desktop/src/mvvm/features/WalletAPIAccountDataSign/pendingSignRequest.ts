import type {
  AccountDataReceiveParams,
  AccountDataSignMessageParams,
  AccountDataSignTransactionParams,
} from "@features/platform-wallet-api-server";

/** The callbacks are not serializable: the request lives here, the dialogs slice only knows it is open. */
export type PendingSignRequest =
  | { id: number; kind: "transaction"; params: AccountDataSignTransactionParams }
  | { id: number; kind: "message"; params: AccountDataSignMessageParams }
  | { id: number; kind: "receive"; params: AccountDataReceiveParams };

type NewSignRequest =
  | { kind: "transaction"; params: AccountDataSignTransactionParams }
  | { kind: "message"; params: AccountDataSignMessageParams }
  | { kind: "receive"; params: AccountDataReceiveParams };

let pending: PendingSignRequest | null = null;
let nextId = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

export const getPendingSignRequest = (): PendingSignRequest | null => pending;

export function subscribePendingSignRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A request still pending is cancelled: the live app gets an answer for each one. */
export function setPendingSignRequest(request: NewSignRequest): void {
  pending?.params.onCancel();
  pending = { ...request, id: ++nextId };
  emit();
}

export function clearPendingSignRequest(id: number): void {
  if (pending?.id !== id) return;
  pending = null;
  emit();
}
