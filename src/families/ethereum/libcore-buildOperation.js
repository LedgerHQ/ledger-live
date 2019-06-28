// @flow

import type { Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";

async function ethereumBuildOperation({
  coreOperation
}: {
  coreOperation: CoreOperation
}) {
  const ethereumLikeOperation = await coreOperation.asEthereumLikeOperation();
  const ethereumLikeTransaction = await ethereumLikeOperation.getTransaction();
  const status = await ethereumLikeTransaction.getStatus();
  const hash = await ethereumLikeTransaction.getHash();
  const transactionSequenceNumber = await ethereumLikeTransaction.getNonce();
  const out: $Shape<Operation> = { hash, transactionSequenceNumber };
  if (status === 0) {
    out.hasFailed = true;
  }
  return out;
}

export default ethereumBuildOperation;
