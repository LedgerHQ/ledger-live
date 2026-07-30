import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { CryptoCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";

import { broadcastTransaction } from "./api/node";

/**
 * Broadcast the signed transaction
 */
export async function broadcast({
  account,
  signedOperation,
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> {
  const { hash } = await broadcastTransaction(signedOperation, {
    ...account.currency,
    id: CryptoCurrencyIdSchema.parse(account.currency.id),
  });
  return patchOperationWithHash(signedOperation.operation, hash);
}
