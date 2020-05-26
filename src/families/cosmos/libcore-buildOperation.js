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

  switch (await message.getRawMessageType()) {
    case "internal/MsgFees":
      out.type = "FEES";
      break;

    case "cosmos-sdk/MsgDelegate":
      out.type = "DELEGATE";
      break;

    case "cosmos-sdk/MsgUndelegate":
      out.type = "UNDELEGATE";
      break;

    case "cosmos-sdk/MsgWithdrawDelegationReward":
      out.type = "REWARD";
      break;

    case "cosmos-sdk/MsgBeginRedelegate":
      out.type = "REDELEGATE";
      break;
  }

  return out;
}

export default cosmosBuildOperation;
