// @flow

import type { Operation } from "../../types";
import type { CoreOperation } from "../../libcore/types";

async function cosmosBuildOperation({
  coreOperation,
}: {
  coreOperation: CoreOperation,
}) {
  const cosmosLikeOperation = await coreOperation.asCosmosLikeOperation();
  const cosmosLikeTransaction = await cosmosLikeOperation.getTransaction();
  const hash = await cosmosLikeTransaction.getHash();
  const message = await cosmosLikeOperation.getMessage();
  const out: $Shape<Operation> = {
    hash: `${hash}-${await message.getIndex()}`,
  };

  if (message && (await message.getRawMessageType()) === "internal/MsgFees") {
    out.type = "FEES";
  }

  return out;
}

export default cosmosBuildOperation;
