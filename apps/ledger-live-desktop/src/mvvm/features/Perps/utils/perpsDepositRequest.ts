import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PerpsDepositResult } from "@ledgerhq/live-common/wallet-api/Perps/server";

type PendingDepositRequest = {
  resolve: (result: PerpsDepositResult) => void;
  reject: (error: Error) => void;
};

let pending: PendingDepositRequest | null = null;

/** Stays pending across the deposit dialogs until settled or cancelled. */
export function beginDepositRequest(): Promise<PerpsDepositResult> {
  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
  });
}

export function settleDepositRequest(result: PerpsDepositResult) {
  pending?.resolve(result);
  pending = null;
}

export function cancelDepositRequest() {
  pending?.reject(new UserRefusedOnDevice());
  pending = null;
}
