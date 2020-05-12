// @flow

import type { CoreOperation } from "../../libcore/types";

async function rippleBuildOperation({
  coreOperation,
}: {
  coreOperation: CoreOperation,
}) {
  const rippleLikeOperation = await coreOperation.asRippleLikeOperation();
  const rippleLikeTransaction = await rippleLikeOperation.getTransaction();
  const hash = await rippleLikeTransaction.getHash();
  return { hash };
}

export default rippleBuildOperation;
