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
  // const type = await tezosLikeTransaction.getType();
  // eslint-disable-next-line no-console
  // console.log("tezos", { type });
  const hash = await tezosLikeTransaction.getHash();
  const out: $Shape<Operation> = { hash };
  return out;
}

export default tezosBuildOperation;
