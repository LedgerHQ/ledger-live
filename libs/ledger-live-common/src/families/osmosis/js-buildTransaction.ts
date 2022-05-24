import { Account } from "../../types";
import { Transaction } from "./types";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { cosmos } from "@keplr-wallet/cosmos";
import { AminoMsg, AminoSignResponse } from "@cosmjs/amino";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { AminoMsgSend, AminoMsgDelegate } from "@cosmjs/stargate";
import Long from "long";
import { Coin } from "@keplr-wallet/proto-types/cosmos/base/v1beta1/coin";
import { PubKey } from "@keplr-wallet/proto-types/cosmos/crypto/secp256k1/keys";
import {
  AuthInfo,
  TxRaw,
  // TxBody,
  Fee,
} from "@keplr-wallet/proto-types/cosmos/tx/v1beta1/tx";
// import { Fee } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";

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
          //todo this should not be gt0, but the minimum required by osmosis to stake
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
          break;
        }
      }
  }
  return { aminoMsgs, protoMsgs };
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

export default buildTransaction;
