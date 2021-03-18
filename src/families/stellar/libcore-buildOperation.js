// @flow

import type { CoreOperation } from "../../libcore/types";
import type { Operation } from "../../types";
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
  const memoObj = await stellarLikeTransaction.getMemo();
  const memo = await memoObj.memoValuetoString();

  const out: $Shape<Operation> = {
    hash,
    transactionSequenceNumber: transactionSequenceNumber.toNumber(),
  };

  if (memo && memo !== "") {
    out.extra = { memo };
  }

  return out;
}

export default stellarBuildOperation;
