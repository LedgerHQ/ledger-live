import { CosmosAccount, Transaction } from "./types";
import {
  makeAuthInfoBytes,
  Registry,
  TxBodyEncodeObject,
} from "@cosmjs/proto-signing";
import {
  MsgDelegate,
  MsgUndelegate,
  MsgBeginRedelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { defaultCosmosAPI } from "./api/Cosmos";
import BigNumber from "bignumber.js";

export const buildTransaction = async (
  account: CosmosAccount,
  transaction: Transaction
): Promise<any> => {
  const msg: Array<{ typeUrl: string; value: any }> = [];

  // Ledger Live is able to build transaction atomically,
  // Take care expected data are complete before push msg.
  // Otherwise, the transaction is silently returned intact.

  let isComplete = true;

  switch (transaction.mode) {
    case "send":
      if (!transaction.recipient || transaction.amount.lte(0)) {
        isComplete = false;
      } else {
        msg.push({
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: {
            fromAddress: account.freshAddress,
            toAddress: transaction.recipient,
            amount: [
              {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toString(),
              },
            ],
          },
        });
      }
      break;

    case "delegate":
      if (!transaction.validators || transaction.validators.length < 1) {
        isComplete = false;
      } else {
        const validator = transaction.validators[0];
        if (!validator) {
          isComplete = false;
          break;
        } else if (!validator.address || transaction.amount.lte(0)) {
          isComplete = false;
        }

        msg.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: {
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: transaction.amount.toString(),
            },
          },
        });
      }
      break;

    case "undelegate":
      if (
        !transaction.validators ||
        transaction.validators.length < 1 ||
        !transaction.validators[0].address ||
        transaction.validators[0].amount.lte(0)
      ) {
        isComplete = false;
      } else {
        msg.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
          value: {
            delegatorAddress: account.freshAddress,
            validatorAddress: transaction.validators[0].address,
            amount: {
              denom: account.currency.units[1].code,
              amount: transaction.validators[0].amount.toString(),
            },
          },
        });
      }
      break;

    case "redelegate":
      if (
        !transaction.sourceValidator ||
        !transaction.validators ||
        transaction.validators.length < 1 ||
        !transaction.validators[0].address ||
        transaction.validators[0].amount.lte(0)
      ) {
        isComplete = false;
      } else {
        msg.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
          value: {
            validatorSrcAddress: transaction.sourceValidator,
            delegatorAddress: account.freshAddress,
            validatorDstAddress: transaction.validators[0].address,
            amount: {
              denom: account.currency.units[1].code,
              amount: transaction.validators[0].amount.toString(),
            },
          },
        });
      }
      break;

    case "claimReward":
      if (
        !transaction.validators ||
        transaction.validators.length < 1 ||
        !transaction.validators[0].address
      ) {
        isComplete = false;
      } else {
        msg.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: {
            delegatorAddress: account.freshAddress,
            validatorAddress: transaction.validators[0].address,
          },
        });
      }
      break;

    case "claimRewardCompound":
      if (
        !transaction.validators ||
        transaction.validators.length < 1 ||
        !transaction.validators[0].address ||
        transaction.validators[0].amount.lte(0)
      ) {
        isComplete = false;
      } else {
        msg.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: {
            delegatorAddress: account.freshAddress,
            validatorAddress: transaction.validators[0].address,
          },
        });

        msg.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: {
            delegatorAddress: account.freshAddress,
            validatorAddress: transaction.validators[0].address,
            amount: {
              denom: account.currency.units[1].code,
              amount: transaction.validators[0].amount.toString(),
            },
          },
        });
      }
      break;
  }

  if (!isComplete) {
    return [];
  }

  return msg;
};

export const postBuildTransaction = async (
  account: CosmosAccount,
  transaction: Transaction,
  pubkey: any,
  unsignedPayload: any,
  signature: Uint8Array
): Promise<any> => {
  const txBodyFields: TxBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: unsignedPayload,
      memo: transaction.memo || "",
    },
  };

  // @ts-expect-error TODO: monorepo detected this error
  const registry = new Registry([
    ["/cosmos.staking.v1beta1.MsgDelegate", MsgDelegate],
    ["/cosmos.staking.v1beta1.MsgUndelegate", MsgUndelegate],
    ["/cosmos.staking.v1beta1.MsgBeginRedelegate", MsgBeginRedelegate],
    [
      "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
      MsgWithdrawDelegatorReward,
    ],
  ]);

  const { sequence } = await defaultCosmosAPI.getAccount(account.freshAddress);

  const txBodyBytes = registry.encode(txBodyFields);

  const authInfoBytes = makeAuthInfoBytes(
    [{ pubkey, sequence }],
    [
      {
        amount: transaction.fees?.toString() || new BigNumber(2500).toString(),
        denom: account.currency.units[1].code,
      },
    ],
    transaction.gas?.toNumber() || new BigNumber(250000).toNumber(),
    SignMode.SIGN_MODE_LEGACY_AMINO_JSON
  );

  const txRaw = TxRaw.fromPartial({
    bodyBytes: txBodyBytes,
    authInfoBytes,
    signatures: [signature],
  });

  const tx_bytes = Array.from(Uint8Array.from(TxRaw.encode(txRaw).finish()));

  return tx_bytes;
};

export default buildTransaction;
