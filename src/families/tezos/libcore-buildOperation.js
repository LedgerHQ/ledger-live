// @flow

import type { Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";
import { tezosOperationTag } from "./types";

const opTagToType = {
  [tezosOperationTag.OPERATION_TAG_REVEAL]: "REVEAL",
  [tezosOperationTag.OPERATION_TAG_ORIGINATION]: "CREATE",
  [tezosOperationTag.OPERATION_TAG_DELEGATION]: "DELEGATE"
};

async function tezosBuildOperation({
  coreOperation
}: {
  coreOperation: CoreOperation
}) {
  const tezosLikeOperation = await coreOperation.asTezosLikeOperation();
  const tezosLikeTransaction = await tezosLikeOperation.getTransaction();
  const tezosType = await tezosLikeTransaction.getType();
  const hash = await tezosLikeTransaction.getHash();
  const out: $Shape<Operation> = { hash };
  const maybeCustomType = opTagToType[tezosType];
  if (maybeCustomType) {
    out.type = maybeCustomType;
  }
  return out;
}

export default tezosBuildOperation;
