import { BigNumber } from "bignumber.js";
import type { CoreOperation } from "../../libcore/types";
import type { Operation } from "../../types";
import { AlgorandOperationTypeEnum } from "./types";

const getAssetId = async (transaction) => {
  if ((await transaction.getType()) === "axfer") {
    const assetInfo = await transaction.getAssetTransferInfo();
    return assetInfo.getAssetId();
  }

  return null;
};

const getOperationType = async (algorandOperation, transaction) => {
  const operationType = await algorandOperation.getAlgorandOperationType();
  let type;

  if ((await transaction.getType()) === "axfer") {
    type = "FEES";
  }

  if (operationType === AlgorandOperationTypeEnum.ASSET_OPT_IN) {
    type = "OPT_IN";
  }

  if (operationType === AlgorandOperationTypeEnum.ASSET_OPT_OUT) {
    type = "OPT_OUT";
  }

  return type;
};

async function algorandBuildOperation({
  coreOperation,
}: {
  coreOperation: CoreOperation;
}) {
  const algorandLikeOperation = await coreOperation.asAlgorandOperation();
  const algorandLikeTransaction = await algorandLikeOperation.getTransaction();
  const hash = await algorandLikeTransaction.getId();
  const out: Partial<Operation> = {
    hash,
  };
  const type = await getOperationType(
    algorandLikeOperation,
    algorandLikeTransaction
  );

  if (type) {
    out.type = type;
  }

  const assetId = await getAssetId(algorandLikeTransaction);

  if (assetId) {
    out.extra = { ...out.extra, assetId: assetId };
  }

  const rewards = await algorandLikeOperation.getRewards();

  if (rewards) {
    out.extra = { ...out.extra, rewards: new BigNumber(rewards) };
  }

  return out;
}

export default algorandBuildOperation;
