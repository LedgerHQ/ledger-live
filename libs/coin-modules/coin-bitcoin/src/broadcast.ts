import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import wallet, { getWalletAccount } from "./wallet-btc";
import { Transaction } from "./types";

/**
 * Broadcast a signed transaction
 * @param {signature: string, operation: string} signedOperation
 */
export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation,
}) => {
  const { signature, operation } = signedOperation;
  console.log("signature", signature);
  console.log("operation", JSON.stringify(operation));
  const walletAccount = getWalletAccount(account);
  // console.log("walletAccount", walletAccount);
  const hash = await wallet.broadcastTx(walletAccount, signature);
  // console.log("hash", hash);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
