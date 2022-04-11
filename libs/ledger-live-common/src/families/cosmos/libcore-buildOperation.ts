import { $Shape } from "utility-types";
import type { Operation, OperationType } from "../../types";
import type { Core, CoreOperation } from "../../libcore/types";
import { BigNumber } from "bignumber.js";
import { CosmosMessage } from "./types";

const translateExtraInfo = async (
  core: Core,
  msg: CosmosMessage,
  type: OperationType
) => {
  let unwrapped: any;
  let amount: BigNumber | undefined;
  let address: string | undefined;
  let cosmosSourceValidator: string;

  switch (type) {
    case "DELEGATE": {
      unwrapped = await core.CosmosLikeMessage.unwrapMsgDelegate(msg);
      const cosmosAmount = await unwrapped.getAmount();
      amount = await cosmosAmount.getAmount();
      address = await unwrapped.getValidatorAddress();
      break;
    }

    case "UNDELEGATE": {
      unwrapped = await core.CosmosLikeMessage.unwrapMsgUndelegate(msg);
      const cosmosAmount = await unwrapped.getAmount();
      amount = await cosmosAmount.getAmount();
      address = await unwrapped.getValidatorAddress();
      break;
    }

    case "REWARD": {
      unwrapped =
        await core.CosmosLikeMessage.unwrapMsgWithdrawDelegationReward(msg);
      address = await unwrapped.getValidatorAddress();
      amount = new BigNumber(0);
      break;
    }

    case "REDELEGATE": {
      unwrapped = await core.CosmosLikeMessage.unwrapMsgBeginRedelegate(msg);
      const cosmosAmount = await unwrapped.getAmount();
      amount = await cosmosAmount.getAmount();
      address = await unwrapped.getValidatorDestinationAddress();
      cosmosSourceValidator = await unwrapped.getValidatorSourceAddress();
      return {
        validators: [
          {
            address,
            amount,
          },
        ],
        cosmosSourceValidator,
      };
    }
  }

  const validator = {
    address,
    amount,
  };

  return {
    validators: [validator],
  };
};

async function cosmosBuildOperation({
  core,
  coreOperation,
}: {
  core: Core;
  coreOperation: CoreOperation;
}): Promise<Partial<Operation>> {
  const cosmosLikeOperation = await coreOperation.asCosmosLikeOperation();
  const cosmosLikeTransaction = await cosmosLikeOperation.getTransaction();
  const hash = await cosmosLikeTransaction.getHash();
  const memo = await cosmosLikeTransaction.getMemo();
  const message = await cosmosLikeOperation.getMessage();
  const out: $Shape<Operation> = {
    hash,
  };

  switch (await message.getRawMessageType()) {
    case "internal/MsgFees":
      out.type = "FEES";
      break;

    case "cosmos-sdk/MsgDelegate":
      out.type = "DELEGATE";
      out.extra = await translateExtraInfo(core, message, out.type);
      break;

    case "cosmos-sdk/MsgUndelegate":
      out.type = "UNDELEGATE";
      out.extra = await translateExtraInfo(core, message, out.type);
      break;

    case "cosmos-sdk/MsgWithdrawDelegationReward":
      out.type = "REWARD";
      out.extra = await translateExtraInfo(core, message, out.type);
      break;

    case "cosmos-sdk/MsgBeginRedelegate":
      out.type = "REDELEGATE";
      out.extra = await translateExtraInfo(core, message, out.type);
      break;
  }

  out.extra = { ...out.extra, id: await message.getIndex() };

  if (memo) {
    out.extra = { ...out.extra, memo };
  }

  return out;
}

export default cosmosBuildOperation;
