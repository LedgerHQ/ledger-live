import { CosmosAccount, Transaction } from "./types";
import {
  MsgDelegate,
  MsgUndelegate,
  MsgBeginRedelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import type { Account } from "@ledgerhq/types-live";
import { AminoMsg, AminoSignResponse } from "@cosmjs/amino";
import {
  AminoMsgSend,
  AminoMsgDelegate,
  AminoMsgUndelegate,
  AminoMsgBeginRedelegate,
  AminoMsgWithdrawDelegatorReward,
} from "@cosmjs/stargate";
import { cosmos } from "@keplr-wallet/cosmos";
import { PubKey } from "@keplr-wallet/proto-types/cosmos/crypto/secp256k1/keys";
import { AuthInfo, Fee } from "@keplr-wallet/proto-types/cosmos/tx/v1beta1/tx";
import { TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import Long from "long";
import { Coin } from "@keplr-wallet/proto-types/cosmos/base/v1beta1/coin";
import BigNumber from "bignumber.js";
import {
  EncodeObject,
  GeneratedType,
  makeAuthInfoBytes,
  Registry,
} from "@cosmjs/proto-signing";
import { CosmosAPI } from "./api/Cosmos";

type ProtoMsg = {
  typeUrl: string;
  value: Uint8Array;
};

export const buildTransaction = async (
  account: Account,
  transaction: Transaction
): Promise<{ aminoMsgs: AminoMsg[]; protoMsgs: ProtoMsg[] }> => {
  const aminoMsgs: Array<AminoMsg> = [];
  const protoMsgs: Array<ProtoMsg> = [];
  switch (transaction.mode) {
    case "send":
      if (transaction.recipient && transaction.amount.gt(0)) {
        const aminoMsg: AminoMsgSend = {
          type: "cosmos-sdk/MsgSend",
          value: {
            from_address: account.freshAddress,
            to_address: transaction.recipient,
            amount: [
              {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toString(),
              },
            ],
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: cosmos.bank.v1beta1.MsgSend.encode({
            fromAddress: account.freshAddress,
            toAddress: transaction.recipient,
            amount: [
              {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toString(),
              },
            ],
          }).finish(),
        });
      }
      break;
    case "delegate":
      if (transaction.validators && transaction.validators.length > 0) {
        const validator = transaction.validators[0];
        if (validator && validator.address && transaction.amount.gt(0)) {
          const aminoMsg: AminoMsgDelegate = {
            type: "cosmos-sdk/MsgDelegate",
            value: {
              delegator_address: account.freshAddress,
              validator_address: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toString(),
              },
            },
          };
          aminoMsgs.push(aminoMsg);

          // PROTO MESSAGE
          protoMsgs.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: MsgDelegate.encode({
              delegatorAddress: account.freshAddress,
              validatorAddress: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: transaction.amount.toString(),
              },
            }).finish(),
          });
        }
      }
      break;

    case "redelegate":
      if (
        transaction.sourceValidator &&
        transaction.validators &&
        transaction.validators.length > 0 &&
        transaction.validators[0].address &&
        transaction.validators[0].amount.gt(0)
      ) {
        const validator = transaction.validators[0];
        const aminoMsg: AminoMsgBeginRedelegate = {
          type: "cosmos-sdk/MsgBeginRedelegate",
          value: {
            delegator_address: account.freshAddress,
            validator_src_address: transaction.sourceValidator,
            validator_dst_address: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toString(),
            },
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
          value: MsgBeginRedelegate.encode({
            delegatorAddress: account.freshAddress,
            validatorSrcAddress: transaction.sourceValidator,
            validatorDstAddress: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toString(),
            },
          }).finish(),
        });
      }
      break;

    case "undelegate":
      if (transaction.validators && transaction.validators.length > 0) {
        const validator = transaction.validators[0];
        if (validator && validator.address && validator.amount.gt(0)) {
          const aminoMsg: AminoMsgUndelegate = {
            type: "cosmos-sdk/MsgUndelegate",
            value: {
              delegator_address: account.freshAddress,
              validator_address: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: validator.amount.toString(),
              },
            },
          };
          aminoMsgs.push(aminoMsg);

          // PROTO MESSAGE
          protoMsgs.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
            value: MsgUndelegate.encode({
              delegatorAddress: account.freshAddress,
              validatorAddress: validator.address,
              amount: {
                denom: account.currency.units[1].code,
                amount: validator.amount.toString(),
              },
            }).finish(),
          });
        }
      }
      break;
    case "claimReward":
      if (
        transaction.validators &&
        transaction.validators.length > 0 &&
        transaction.validators[0].address
      ) {
        const validator = transaction.validators[0];
        const aminoMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: account.freshAddress,
            validator_address: validator.address,
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
          }).finish(),
        });
      }
      break;
    case "claimRewardCompound":
      if (
        transaction.validators &&
        transaction.validators.length > 0 &&
        transaction.validators[0].address &&
        transaction.validators[0].amount.gt(0)
      ) {
        const validator = transaction.validators[0];
        // AMINO MESSAGES
        const aminoWithdrawRewardMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: account.freshAddress,
            validator_address: validator.address,
          },
        };
        const aminoDelegateMsg: AminoMsgDelegate = {
          type: "cosmos-sdk/MsgDelegate",
          value: {
            delegator_address: account.freshAddress,
            validator_address: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toString(),
            },
          },
        };
        aminoMsgs.push(aminoWithdrawRewardMsg, aminoDelegateMsg);

        // PROTO MESSAGES
        protoMsgs.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
          }).finish(),
        });
        protoMsgs.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: MsgDelegate.encode({
            delegatorAddress: account.freshAddress,
            validatorAddress: validator.address,
            amount: {
              denom: account.currency.units[1].code,
              amount: validator.amount.toString(),
            },
          }).finish(),
        });
      }
      break;
  }
  return { aminoMsgs, protoMsgs };
};

/* Build transaction with unsigned payload for simulation and gas estimation */
export const buildUnsignedPayloadTransaction = async (
  account: CosmosAccount,
  transaction: Transaction
): Promise<{ typeUrl: string; value: EncodeObject }[]> => {
  const messages: Array<{ typeUrl: string; value: any }> = [];

  // Ledger Live is able to build transaction atomically,
  // Take care expected data are complete before push msg.
  // Otherwise, the transaction is silently returned intact.

  let isComplete = true;

  switch (transaction.mode) {
    case "send":
      if (!transaction.recipient || transaction.amount.lte(0)) {
        isComplete = false;
      } else {
        messages.push({
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

        messages.push({
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
        messages.push({
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
        messages.push({
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
        messages.push({
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
        messages.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: {
            delegatorAddress: account.freshAddress,
            validatorAddress: transaction.validators[0].address,
          },
        });

        messages.push({
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

  return messages;
};

export const postBuildTransaction = async (
  signResponse: AminoSignResponse,
  protoMsgs: Array<ProtoMsg>
): Promise<Uint8Array> => {
  const signed_tx_bytes = TxRaw.encode({
    bodyBytes: TxBody.encode(
      TxBody.fromPartial({
        messages: protoMsgs,
        memo: signResponse.signed.memo,
        timeoutHeight: undefined,
        extensionOptions: [],
        nonCriticalExtensionOptions: [],
      })
    ).finish(),
    authInfoBytes: AuthInfo.encode({
      signerInfos: [
        {
          publicKey: {
            typeUrl: "/cosmos.crypto.secp256k1.PubKey",
            value: PubKey.encode({
              key: Buffer.from(signResponse.signature.pub_key.value, "base64"),
            }).finish(),
          },
          modeInfo: {
            single: {
              mode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
            },
            multi: undefined,
          },
          sequence: Long.fromString(signResponse.signed.sequence),
        },
      ],
      fee: Fee.fromPartial({
        amount: signResponse.signed.fee.amount
          ? (signResponse.signed.fee.amount as Coin[])
          : undefined,
        gasLimit: signResponse.signed.fee.gas,
      }),
    }).finish(),
    signatures: [Buffer.from(signResponse.signature.signature, "base64")],
  }).finish();

  return signed_tx_bytes;
};

export const postBuildUnsignedPayloadTransaction = async (
  account: CosmosAccount,
  transaction: Transaction,
  pubkey: EncodeObject,
  unsignedPayload: EncodeObject[],
  signature: Uint8Array
): Promise<number[]> => {
  const txBodyFields = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: unsignedPayload,
      memo: transaction.memo || "",
    },
  };

  const registry = new Registry([
    [
      "/cosmos.staking.v1beta1.MsgDelegate",
      MsgDelegate as unknown as GeneratedType,
    ],
    [
      "/cosmos.staking.v1beta1.MsgUndelegate",
      MsgUndelegate as unknown as GeneratedType,
    ],
    [
      "/cosmos.staking.v1beta1.MsgBeginRedelegate",
      MsgBeginRedelegate as unknown as GeneratedType,
    ],
    [
      "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
      MsgWithdrawDelegatorReward as unknown as GeneratedType,
    ],
  ]);

  const cosmosAPI = new CosmosAPI(account.currency.id);
  const { sequence } = await cosmosAPI.getAccount(account.freshAddress);

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
