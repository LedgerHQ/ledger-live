// @flow

import type { Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";

async function tezosBuildOperation({
  coreOperation
}: {
  coreOperation: CoreOperation
}) {
  const tezosLikeOperation = await coreOperation.asTezosLikeOperation();
  const tezosLikeTransaction = await tezosLikeOperation.getTransaction();
  const tezosType = await tezosLikeTransaction.getType();
  const hash = await tezosLikeTransaction.getHash();
  const out: $Shape<Operation> = { hash, extra: { tezosType } };
  return out;
}

export default tezosBuildOperation;
