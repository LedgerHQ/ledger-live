import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import type { ZilliqaAccount } from "./types";
import { BN } from "@zilliqa-js/util";
import { patchOperationWithHash } from "../../operation";
import { fromBech32 } from "./utils";
import { buildNativeTransaction } from "./js-buildTransaction";
import { getMinimumGasPrice, broadcastTransaction } from "./api";
import { getNonce } from "./logic";

export const broadcast = async ({
  account,
  signedOperation,
}: {
  account: ZilliqaAccount;
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const { signature, operation } = signedOperation;
  const i = signature.indexOf(":");

  const sign = signature.substring(i + 1, signature.length);
  // Unfortunately, the zilliqa-js API only allows encoding of the
  // transaction, but not decoding. In a future version of this implmentation
  // it would be preferable to unpack the transaction payload rather than
  // reconstructing the transaction:
  //
  // const payload = signature.substring(0, i);
  // const params = decodeTransactionProto(payload); /// <- this function does not exist
  //

  // Reconstructing the transaction
  const toAddr = fromBech32(operation.recipients[0]);
  const gasPrice = await getMinimumGasPrice();
  const tx = await buildNativeTransaction(
    account,
    toAddr,
    getNonce(account),
    new BN(operation.extra.amount.toString()),
    gasPrice,
    sign
  );

  const params = tx.txParams;

  // Broadcasting transaction
  let hash: string;
  try {
    hash = await broadcastTransaction(params);
  } catch (e) {
    throw Error("Failed to broadcast.");
  }

  return patchOperationWithHash(operation, hash);
};
