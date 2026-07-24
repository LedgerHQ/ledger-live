import { makeSignDoc, serializeSignDoc } from "@cosmjs/amino";
import {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { txToMessages } from "../../buildTransaction";
import cryptoFactory from "../../chain/chain";
import { CosmosAPI } from "../../network/Cosmos";
import { estimateFees } from "./estimateFees";
import { intentToMessageParams } from "./intentAdapter";

/**
 * Serialized crafted-transaction payload exchanged between {@link craftTransaction}
 * and `combine`. `signable` is the Amino sign-doc the device signs; the remaining
 * fields let `combine` rebuild the protobuf `TxRaw` once the signature is known.
 */
export type CosmosCraftedTransaction = {
  protoMsgs: { typeUrl: string; value: string }[]; // value = base64
  memo: string;
  pubKeyType: string;
  feeAmount: { denom: string; amount: string }[];
  gasLimit: string;
  sequence: string;
  accountNumber: string;
  chainId: string;
  signable: string; // base64(serializeSignDoc) — what the signer signs
};

/**
 * Craft an unsigned transaction from an intent. The Cosmos device signs Amino
 * JSON only, so the payload carries the Amino sign-doc (`signable`) plus what
 * `combine` needs to rebuild the protobuf `TxRaw`. Fees: `customFees` or estimated.
 */
export async function craftTransaction(
  api: CosmosAPI,
  currencyId: string,
  intent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const params = intentToMessageParams(intent, currencyId);
  const chainInstance = cryptoFactory(currencyId);

  const { aminoMsgs, protoMsgs } = txToMessages(params, chainInstance);
  const { accountNumber, sequence, pubKeyType } = await api.getAccount(intent.sender);

  const fees = customFees ?? (await estimateFees(currencyId, intent));
  const gasLimitValue = fees.parameters?.gasLimit;
  // customFees.parameters is optional; an empty gas crafts a chain-rejected tx, so fail loudly.
  if (gasLimitValue === undefined || gasLimitValue === null || String(gasLimitValue) === "") {
    throw new Error(
      "craftTransaction: missing gas limit — provide customFees.parameters.gasLimit or omit customFees to estimate",
    );
  }
  const gasLimit = String(gasLimitValue);
  const denom = params.denom;
  const feeAmount = [{ denom, amount: fees.value.toString() }];

  const chainId = (await api.getNodeInfo()).default_node_info.network;

  const signDoc = makeSignDoc(
    aminoMsgs,
    { amount: feeAmount, gas: gasLimit },
    chainId,
    params.memo,
    accountNumber.toString(),
    sequence.toString(),
  );

  const payload: CosmosCraftedTransaction = {
    protoMsgs: protoMsgs.map(m => ({
      typeUrl: m.typeUrl,
      value: Buffer.from(m.value).toString("base64"),
    })),
    memo: params.memo,
    pubKeyType,
    feeAmount,
    gasLimit,
    sequence: sequence.toString(),
    accountNumber: accountNumber.toString(),
    chainId,
    signable: Buffer.from(serializeSignDoc(signDoc)).toString("base64"),
  };

  return { transaction: JSON.stringify(payload) };
}
