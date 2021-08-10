import type { Transaction, CosmosMessage } from "./types";
import type { Core } from "../../libcore/types";
import { promiseAllBatched } from "../../promise";
import type { CryptoCurrency } from "../../types";

const getAmount = async (
  core: Core,
  currency: CryptoCurrency,
  amount: string
) => {
  return await core.CosmosLikeAmount.init(
    amount,
    currency.id === "cosmos_testnet" ? "umuon" : "uatom"
  );
};

export const cosmosCreateMessage = async (
  freshAddress: string,
  transaction: Transaction,
  core: Core,
  currency: CryptoCurrency
): Promise<CosmosMessage[]> => {
  const { recipient } = transaction;

  switch (transaction.mode) {
    case "send":
      return [
        await core.CosmosLikeMessage.wrapMsgSend(
          await core.CosmosLikeMsgSend.init(freshAddress, recipient, [
            await getAmount(core, currency, transaction.amount.toString()),
          ])
        ),
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
          await core.CosmosLikeMessage.wrapMsgDelegate(
            await core.CosmosLikeMsgDelegate.init(
              freshAddress,
              validator.address,
              await getAmount(core, currency, validator.amount.toString())
            )
          )
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
          await core.CosmosLikeMessage.wrapMsgUndelegate(
            await core.CosmosLikeMsgUndelegate.init(
              freshAddress,
              validator.address,
              await getAmount(core, currency, validator.amount.toString())
            )
          )
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
          await core.CosmosLikeMessage.wrapMsgBeginRedelegate(
            await core.CosmosLikeMsgBeginRedelegate.init(
              freshAddress,
              cosmosSourceValidator,
              validator.address,
              await getAmount(core, currency, validator.amount.toString())
            )
          )
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
          await core.CosmosLikeMessage.wrapMsgWithdrawDelegationReward(
            await core.CosmosLikeMsgWithdrawDelegationReward.init(
              freshAddress,
              validator.address
            )
          )
      );
    }

    case "claimRewardCompound": {
      const { validators } = transaction;

      if (!validators || validators.length === 0) {
        throw new Error("no validators");
      }

      return [
        ...(await promiseAllBatched(2, validators, async (validator) => {
          return await core.CosmosLikeMessage.wrapMsgWithdrawDelegationReward(
            await core.CosmosLikeMsgWithdrawDelegationReward.init(
              freshAddress,
              validator.address
            )
          );
        })),
        ...(await promiseAllBatched(2, validators, async (validator) => {
          return await core.CosmosLikeMessage.wrapMsgDelegate(
            await core.CosmosLikeMsgDelegate.init(
              freshAddress,
              validator.address,
              await getAmount(core, currency, validator.amount.toString())
            )
          );
        })),
      ];
    }
  }

  throw new Error(`unknown message : ${transaction.mode}`);
};
