// @flow

import type { Transaction, CosmosMessage } from "./types";
import type { Core } from "../../libcore/types";
import { promiseAllBatched } from "../../promise";

export const cosmosCreateMessage = async (
  freshAddress: string,
  transaction: Transaction,
  core: Core
): Promise<CosmosMessage[]> => {
  const { recipient } = transaction;

  switch (transaction.mode) {
    case "send":
      return [
        await core.CosmosLikeMessage.wrapMsgSend({
          fromAddress: freshAddress,
          toAddress: recipient,
          amount: [{ amount: transaction.amount.toString(), denom: "uatom" }],
        }),
      ];

    case "delegate": {
      const { validators } = transaction;
      if (!validators || validators.length === 0) {
        throw new Error("no validators");
      }
      return await promiseAllBatched(
        2,
        validators,
        async (validator) =>
          await core.CosmosLikeMessage.wrapMsgDelegate({
            delegatorAddress: freshAddress,
            validatorAddress: validator.address,
            amount: { amount: validator.amount.toString(), denom: "uatom" },
          })
      );
    }

    case "undelegate": {
      const { validators } = transaction;
      if (!validators || validators.length === 0) {
        throw new Error("no validators");
      }
      return await promiseAllBatched(
        2,
        validators,
        async (validator) =>
          await core.CosmosLikeMessage.wrapMsgUndelegate({
            delegatorAddress: freshAddress,
            validatorAddress: validator.address,
            amount: { amount: validator.amount.toString(), denom: "uatom" },
          })
      );
    }

    case "redelegate": {
      const { cosmosSourceValidator } = transaction;
      if (!cosmosSourceValidator) {
        throw new Error("source validator is empty");
      }
      const { validators } = transaction;
      if (!validators || validators.length === 0) {
        throw new Error("no validators");
      }
      return await promiseAllBatched(
        2,
        validators,
        async (validator) =>
          await core.CosmosLikeMessage.wrapMsgBeginRedelegate({
            delegatorAddress: freshAddress,
            validatorSourceAddress: cosmosSourceValidator,
            validatorDestinationAddress: validator.address,
            amount: { amount: validator.amount.toString(), denom: "uatom" },
          })
      );
    }

    case "claimReward": {
      const { validators } = transaction;
      if (!validators || validators.length === 0) {
        throw new Error("no validators");
      }
      return await promiseAllBatched(
        2,
        validators,
        async (validator) =>
          await core.CosmosLikeMessage.wrapMsgWithdrawDelegationReward({
            delegatorAddress: freshAddress,
            validatorAddress: validator.address,
          })
      );
    }

    case "claimRewardCompound": {
      const { validators } = transaction;
      if (!validators || validators.length === 0) {
        throw new Error("no validators");
      }
      return [
        ...(await promiseAllBatched(2, validators, async (validator) => {
          return await core.CosmosLikeMessage.wrapMsgWithdrawDelegationReward({
            delegatorAddress: freshAddress,
            validatorAddress: validator.address,
          });
        })),
        ...(await promiseAllBatched(2, validators, async (validator) => {
          return await core.CosmosLikeMessage.wrapMsgDelegate({
            delegatorAddress: freshAddress,
            validatorAddress: validator.address,
            amount: { amount: validator.amount.toString(), denom: "uatom" },
          });
        })),
      ];
    }
  }
  throw new Error(`unknown message : ${transaction.mode}`);
};
