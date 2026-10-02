import { v4 as uuid } from "uuid";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PerpsDepositResult } from "@ledgerhq/live-common/wallet-api/Perps/server";

type PendingDepositRequest = {
  id: string;
  resolve: (result: PerpsDepositResult) => void;
  reject: (error: Error) => void;
};

let pending: PendingDepositRequest | null = null;

/** Stays pending across the deposit dialogs until settled or cancelled. */
export function beginDepositRequest(): Promise<PerpsDepositResult> {
  const id = uuid();
  return new Promise((resolve, reject) => {
    pending = { id, resolve, reject };
  });
}

export function getDepositRequestId(): string | null {
  return pending?.id ?? null;
}

export function settleDepositRequest(id: string | null, result: PerpsDepositResult) {
  if (id === null || pending?.id !== id) return;
  pending.resolve(result);
  pending = null;
}

export function cancelDepositRequest() {
  pending?.reject(new UserRefusedOnDevice());
  pending = null;
}
