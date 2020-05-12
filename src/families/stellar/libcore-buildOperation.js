// @flow

import type { CoreOperation } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

async function stellarBuildOperation({
  coreOperation,
}: {
  coreOperation: CoreOperation,
}) {
  const stellarLikeOperation = await coreOperation.asStellarLikeOperation();
  const stellarLikeRecord = await stellarLikeOperation.getRecord();
  const stellarLikeTransaction = await stellarLikeOperation.getTransaction();
  const hash = await stellarLikeRecord.getTransactionHash();
  const transactionSequenceNumberRaw = await stellarLikeTransaction.getSourceAccountSequence();
  const transactionSequenceNumber = await libcoreBigIntToBigNumber(
    transactionSequenceNumberRaw
  );
  return {
    hash,
    transactionSequenceNumber: transactionSequenceNumber.toNumber(),
  };
}

export default stellarBuildOperation;
