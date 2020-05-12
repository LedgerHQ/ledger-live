// @flow

import type { CoreOperation } from "../../libcore/types";

async function bitcoinBuildOperation({
  coreOperation,
}: {
  coreOperation: CoreOperation,
}) {
  const bitcoinLikeOperation = await coreOperation.asBitcoinLikeOperation();
  const bitcoinLikeTransaction = await bitcoinLikeOperation.getTransaction();
  const hash = await bitcoinLikeTransaction.getHash();
  return { hash };
}

export default bitcoinBuildOperation;
