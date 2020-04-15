// @flow

import type { CoreOperation } from "../../libcore/types";

async function stellarBuildOperation({
  coreOperation
}: {
  coreOperation: CoreOperation
}) {
  const stellarLikeOperation = await coreOperation.asStellarLikeOperation();
  const stellarLikeTransaction = await stellarLikeOperation.getRecord();
  const hash = await stellarLikeTransaction.getTransactionHash();
  return { hash };
}

export default stellarBuildOperation;
