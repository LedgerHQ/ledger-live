import type {
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { Message } from "iso-filecoin/message";
import { fetchEstimatedFees } from "../api/api";
import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
import {
  isEthereumConvertableAddr,
  isFilEthAddress,
  validateAddress,
} from "../network/addresses";
import { BroadcastBlockIncl } from "../types";
import { Methods } from "../bridge/utils";

/**
 * In-memory representation of a crafted (unsigned) Filecoin transaction.
 * Stored as the `transaction` field inside {@link CraftedTransaction}.
 */
export type FilecoinCraftedMessage = {
  /** base64-encoded CBOR payload sent to the hardware wallet for signing */
  cbor: string;
  message: {
    version: number;
    to: string;
    from: string;
    nonce: number;
    value: string;
    gasLimit: number;
    gasFeeCap: string;
    gasPremium: string;
    method: number;
    params: string;
  };
  /** secp256k1 compact = 1 */
  signatureType: number;
};

export async function craftTransaction(
  intent: TransactionIntent<MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const { sender, recipient, amount, asset } = intent;

  const senderValidation = validateAddress(sender);
  if (!senderValidation.isValid) throw new Error("Invalid sender address");

  const recipientValidation = validateAddress(recipient);
  if (!recipientValidation.isValid) throw new Error("Invalid recipient address");

  const assetWithRef = asset as { assetReference?: string };
  const isTokenTransfer = asset.type !== "native" && assetWithRef.assetReference !== undefined;
  const contractAddress = isTokenTransfer ? assetWithRef.assetReference : undefined;

  const method =
    isFilEthAddress(recipientValidation.parsedAddress) || isTokenTransfer
      ? Methods.InvokeEVM
      : Methods.Transfer;

  let finalTo = recipientValidation.parsedAddress.toString();
  let params: string | undefined;
  const amountStr = isTokenTransfer ? "0" : amount.toString();

  if (isTokenTransfer && contractAddress) {
    const contractValidation = validateAddress(contractAddress);
    if (!contractValidation.isValid) throw new Error("Invalid token contract address");
    finalTo = contractValidation.parsedAddress.toString();

    if (isEthereumConvertableAddr(recipientValidation.parsedAddress)) {
      params = generateTokenTxnParams(recipient, new BigNumber(amount.toString()));
    }
  }

  let gasFeeCap: string;
  let gasPremium: string;
  let gasLimit: number;
  let nonce: number;

  if (customFees?.parameters) {
    gasFeeCap = String(customFees.parameters["gasFeeCap"]);
    gasPremium = String(customFees.parameters["gasPremium"]);
    gasLimit = Number(customFees.parameters["gasLimit"]);
    nonce = Number(customFees.parameters["nonce"]);
  } else {
    const encodedParams = params ? encodeTxnParams(params) : undefined;
    const result = await fetchEstimatedFees({
      to: finalTo,
      from: senderValidation.parsedAddress.toString(),
      methodNum: method,
      blockIncl: BroadcastBlockIncl,
      ...(isTokenTransfer && encodedParams ? { params: encodedParams } : {}),
      ...(isTokenTransfer ? { value: "0" } : {}),
    });
    gasFeeCap = result.gas_fee_cap;
    gasPremium = result.gas_premium;
    gasLimit = result.gas_limit;
    nonce = result.nonce;
  }

  const encodedParams = params ? encodeTxnParams(params) : "";

  const message = new Message({
    to: finalTo,
    from: senderValidation.parsedAddress.toString(),
    gasFeeCap,
    gasLimit,
    gasPremium,
    method,
    nonce,
    params: encodedParams || undefined,
    version: 0,
    value: amountStr,
  });

  const cborBuffer = message.serialize();

  const craftedMessage: FilecoinCraftedMessage = {
    cbor: cborBuffer.toString("base64"),
    message: {
      version: 0,
      to: finalTo,
      from: senderValidation.parsedAddress.toString(),
      nonce,
      value: amountStr,
      gasLimit,
      gasFeeCap,
      gasPremium,
      method,
      params: encodedParams,
    },
    signatureType: 1,
  };

  return { transaction: JSON.stringify(craftedMessage) };
}
