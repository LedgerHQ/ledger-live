import { AminoMsgSend, AminoMsgWithdrawDelegatorReward } from "@cosmjs/stargate";
import {
  MsgWrappedBeginRedelegate,
  MsgWrappedDelegate,
  MsgWrappedUndelegate,
} from "@keplr-wallet/proto-types/babylon/epoching/v1/tx";
import { PubKey } from "@keplr-wallet/proto-types/cosmos/crypto/secp256k1/keys";
import { AuthInfo, Fee } from "@keplr-wallet/proto-types/cosmos/tx/v1beta1/tx";
import type { Account } from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import {
  MsgBeginRedelegate,
  MsgDelegate,
  MsgUndelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import CosmosBase, { StakingMessageType } from "./chain/cosmosBase";
import { CosmosDelegationInfo, CosmosOperationMode, Transaction } from "./types";

type ProtoMsg = {
  typeUrl: string;
  value: Uint8Array;
};

type AminoMsg = {
  readonly type: string;
  readonly value: any;
};

/**
 * Framework-neutral inputs the amino/proto builders read — no dependency on `@types/live`
 * `Account` / `Transaction`. The Alpaca logic layer builds this straight from a `TransactionIntent`
 * (`intentToMessageParams`); the bridge derives it from its account/transaction
 * (`messageParamsFromTransaction`). `memo` is carried for fee estimation; `txToMessages` ignores it.
 */
export type CosmosTransactionParams = {
  mode: CosmosOperationMode;
  senderAddress: string;
  currencyId: string;
  denom: string;
  recipient: string;
  amount: BigNumber;
  memo: string;
  validators: CosmosDelegationInfo[];
  sourceValidator?: string;
};

export const txToMessages = (
  params: CosmosTransactionParams,
  chain: CosmosBase,
): { aminoMsgs: AminoMsg[]; protoMsgs: ProtoMsg[] } => {
  const aminoMsgs: Array<AminoMsg> = [];
  const protoMsgs: Array<ProtoMsg> = [];
  const { stakingMessages } = chain;

  const pushStakingMsg = <T>(
    { aminoType, protoTypeUrl }: StakingMessageType,
    aminoValue: object,
    protoValue: T,
    encodeInner: (value: T) => { finish: () => Uint8Array },
    encodeWrapped: (value: { msg: T }) => { finish: () => Uint8Array },
  ): void => {
    aminoMsgs.push({
      type: aminoType,
      value: stakingMessages.wrapped ? { msg: aminoValue } : aminoValue,
    });
    protoMsgs.push({
      typeUrl: protoTypeUrl,
      value: stakingMessages.wrapped
        ? encodeWrapped({ msg: protoValue }).finish()
        : encodeInner(protoValue).finish(),
    });
  };

  switch (params.mode) {
    case "send":
      if (params.recipient && params.amount.gt(0)) {
        const aminoMsg: AminoMsgSend = {
          type: "cosmos-sdk/MsgSend",
          value: {
            from_address: params.senderAddress,
            to_address: params.recipient,
            amount: [
              {
                denom: params.denom,
                amount: params.amount.toFixed(),
              },
            ],
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: MsgSend.encode({
            fromAddress: params.senderAddress,
            toAddress: params.recipient,
            amount: [
              {
                denom: params.denom,
                amount: params.amount.toFixed(),
              },
            ],
          }).finish(),
        });
      }
      break;
    case "delegate":
      if (params.validators && params.validators.length > 0) {
        const validator = params.validators[0];
        if (validator?.address && params.amount.gt(0)) {
          const amount = {
            denom: params.denom,
            amount: params.amount.toFixed(),
          };
          pushStakingMsg(
            stakingMessages.delegate,
            {
              delegator_address: params.senderAddress,
              validator_address: validator.address,
              amount,
            },
            {
              delegatorAddress: params.senderAddress,
              validatorAddress: validator.address,
              amount,
            },
            MsgDelegate.encode,
            MsgWrappedDelegate.encode,
          );
        }
      }
      break;

    case "redelegate":
      if (
        params.sourceValidator &&
        params.validators &&
        params.validators.length > 0 &&
        params.validators[0].address &&
        params.validators[0].amount.gt(0)
      ) {
        const validator = params.validators[0];
        const amount = {
          denom: params.denom,
          amount: validator.amount.toFixed(),
        };
        pushStakingMsg(
          stakingMessages.beginRedelegate,
          {
            delegator_address: params.senderAddress,
            validator_src_address: params.sourceValidator,
            validator_dst_address: validator.address,
            amount,
          },
          {
            delegatorAddress: params.senderAddress,
            validatorSrcAddress: params.sourceValidator,
            validatorDstAddress: validator.address,
            amount,
          },
          MsgBeginRedelegate.encode,
          MsgWrappedBeginRedelegate.encode,
        );
      }
      break;

    case "undelegate":
      if (params.validators && params.validators.length > 0) {
        const validator = params.validators[0];
        if (validator && validator.address && validator.amount.gt(0)) {
          const amount = {
            denom: params.denom,
            amount: validator.amount.toFixed(),
          };
          pushStakingMsg(
            stakingMessages.undelegate,
            {
              delegator_address: params.senderAddress,
              validator_address: validator.address,
              amount,
            },
            {
              delegatorAddress: params.senderAddress,
              validatorAddress: validator.address,
              amount,
            },
            MsgUndelegate.encode,
            MsgWrappedUndelegate.encode,
          );
        }
      }
      break;
    case "claimReward":
      if (params.validators && params.validators.length > 0 && params.validators[0].address) {
        const validator = params.validators[0];
        const aminoMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: params.senderAddress,
            validator_address: validator.address,
          },
        };
        aminoMsgs.push(aminoMsg);

        // PROTO MESSAGE
        protoMsgs.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: params.senderAddress,
            validatorAddress: validator.address,
          }).finish(),
        });
      }
      break;
    case "claimRewardCompound":
      if (
        params.validators &&
        params.validators.length > 0 &&
        params.validators[0].address &&
        params.validators[0].amount.gt(0)
      ) {
        const validator = params.validators[0];
        if (stakingMessages.wrapped) {
          // compound's embedded delegate isn't epoching-wrapped yet (LIVE-33994); fail fast on
          // wrapped/epoching chains rather than sign a bare cosmos-sdk delegate the chain rejects.
          throw new Error(`claimRewardCompound is not supported on ${params.currencyId}`);
        }
        // AMINO MESSAGES
        const aminoWithdrawRewardMsg: AminoMsgWithdrawDelegatorReward = {
          type: "cosmos-sdk/MsgWithdrawDelegationReward",
          value: {
            delegator_address: params.senderAddress,
            validator_address: validator.address,
          },
        };
        const aminoDelegateMsg: AminoMsg = {
          type: stakingMessages.delegate.aminoType,
          value: {
            delegator_address: params.senderAddress,
            validator_address: validator.address,
            amount: {
              denom: params.denom,
              amount: validator.amount.toFixed(),
            },
          },
        };
        aminoMsgs.push(aminoWithdrawRewardMsg, aminoDelegateMsg);

        // PROTO MESSAGES
        protoMsgs.push({
          typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
          value: MsgWithdrawDelegatorReward.encode({
            delegatorAddress: params.senderAddress,
            validatorAddress: validator.address,
          }).finish(),
        });
        protoMsgs.push({
          typeUrl: stakingMessages.delegate.protoTypeUrl,
          value: MsgDelegate.encode({
            delegatorAddress: params.senderAddress,
            validatorAddress: validator.address,
            amount: {
              denom: params.denom,
              amount: validator.amount.toFixed(),
            },
          }).finish(),
        });
      }
      break;
  }
  return { aminoMsgs, protoMsgs };
};

/**
 * Account/transaction-bridge adapter: derive {@link CosmosTransactionParams} from the `@types/live`
 * account/transaction the bridge holds, so `signOperation` / `prepareTransaction` keep feeding the
 * shared builders without leaking those types into the Alpaca logic layer.
 */
export function messageParamsFromTransaction(
  account: Account,
  transaction: Transaction,
): CosmosTransactionParams {
  return {
    mode: transaction.mode,
    senderAddress: account.freshAddress,
    currencyId: account.currency.id,
    denom: account.currency.units[1].code,
    recipient: transaction.recipient,
    amount: transaction.amount,
    memo: transaction.memo || "",
    validators: transaction.validators,
    ...(transaction.sourceValidator ? { sourceValidator: transaction.sourceValidator } : {}),
  };
}

export const buildTransaction = ({
  protoMsgs,
  memo,
  pubKeyType,
  pubKey,
  feeAmount,
  gasLimit,
  sequence,
  signature,
}: {
  protoMsgs: Array<ProtoMsg>;
  memo: string;
  pubKeyType: string;
  pubKey: string;
  feeAmount: { amount: string; denom: string }[] | undefined;
  gasLimit: string | undefined;
  sequence: string | number;
  signature: Uint8Array;
}): Uint8Array => {
  const signedTx = TxRaw.encode({
    bodyBytes: TxBody.encode(
      TxBody.fromPartial({
        messages: protoMsgs,
        memo,
        timeoutHeight: undefined,
        extensionOptions: [],
        nonCriticalExtensionOptions: [],
      }),
    ).finish(),
    authInfoBytes: AuthInfo.encode({
      signerInfos: [
        {
          publicKey: {
            typeUrl: pubKeyType,
            value: PubKey.encode({
              key: Buffer.from(pubKey, "base64"),
            }).finish(),
          },
          modeInfo: {
            single: {
              mode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
            },
            multi: undefined,
          },
          sequence: sequence.toString(),
        },
      ],
      fee: Fee.fromPartial({
        amount: feeAmount,
        gasLimit: gasLimit,
      }),
    }).finish(),
    signatures: [signature],
  }).finish();

  return signedTx;
};
