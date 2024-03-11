import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import wallet, { getWalletAccount } from "./wallet-btc";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
const broadcast = async ({
  account,
  signedOperation,
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const walletAccount = getWalletAccount(account);
  const hash = await wallet.broadcastTx(walletAccount, signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
