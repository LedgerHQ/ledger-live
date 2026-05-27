import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { fetchEstimatedFees } from "../api/api";
import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
import { isFilEthAddress, isEthereumConvertableAddr, validateAddress } from "../network/addresses";
import { BroadcastBlockIncl } from "../types";
import { Methods, calculateEstimatedFees } from "../bridge/utils";

export async function estimateFees(
  intent: TransactionIntent<MemoNotSupported>,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
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

  if (isTokenTransfer && contractAddress) {
    const contractValidation = validateAddress(contractAddress);
    if (!contractValidation.isValid) throw new Error("Invalid token contract address");
    finalTo = contractValidation.parsedAddress.toString();

    if (isEthereumConvertableAddr(recipientValidation.parsedAddress)) {
      params = generateTokenTxnParams(recipient, new BigNumber(amount.toString()));
    }
  }

  const encodedParams = params ? encodeTxnParams(params) : undefined;

  const result = await fetchEstimatedFees({
    to: finalTo,
    from: senderValidation.parsedAddress.toString(),
    methodNum: method,
    blockIncl: BroadcastBlockIncl,
    ...(isTokenTransfer && encodedParams ? { params: encodedParams } : {}),
    ...(isTokenTransfer ? { value: "0" } : {}),
  });

  const gasFeeCap = new BigNumber(result.gas_fee_cap);
  const gasLimit = new BigNumber(result.gas_limit);
  const feeValue = calculateEstimatedFees(gasFeeCap, gasLimit);

  return {
    value: BigInt(feeValue.toFixed(0)),
    parameters: {
      gasFeeCap: result.gas_fee_cap,
      gasPremium: result.gas_premium,
      gasLimit: result.gas_limit,
      nonce: result.nonce,
    },
  };
}
