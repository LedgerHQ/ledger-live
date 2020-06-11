// @flow

import type { Operation } from "../../types";
import type { Core, CoreOperation } from "../../libcore/types";
import { BigNumber } from "bignumber.js";

const translateExtraInfo = async (core: Core, msg, type) => {
  let unwrapped, amount, address, cosmosSourceValidator;
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
      unwrapped = await core.CosmosLikeMessage.unwrapMsgWithdrawDelegationReward(
        msg
      );
      address = await unwrapped.getValidatorAddress();
      amount = BigNumber(0);
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

  return {
    validators: [
      {
        address,
        amount,
      },
    ],
  };
};

async function cosmosBuildOperation({
  core,
  coreOperation,
}: {
  core: Core,
  coreOperation: CoreOperation,
}) {
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
