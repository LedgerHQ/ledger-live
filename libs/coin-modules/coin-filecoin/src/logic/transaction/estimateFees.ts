import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { fetchEstimatedFees } from "../../api/api";
import { encodeTxnParams, generateTokenTxnParams } from "../../erc20/tokenAccounts";
import { validateAddress } from "../../network";
import type { EstimatedFeesRequest } from "../../types";
import { BroadcastBlockIncl } from "../../types";
import { calculateEstimatedFees, Methods } from "../../common-logic/fees";

/**
 * Estimates the fees for a Filecoin transaction intent.
 *
 * Returns a `FeeEstimation` with:
 *   - `value`: total fee (gasFeeCap × gasLimit)
 *   - `parameters`: gas breakdown (gasLimit, gasFeeCap, gasPremium, nonce)
 */
export async function estimateFees(
  transactionIntent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const { sender, recipient, asset } = transactionIntent;

  const isTokenTransfer = asset.type !== "native";
  const tokenContractAddress =
    isTokenTransfer && "assetReference" in asset ? asset.assetReference ?? "" : "";

  const senderValidation = validateAddress(sender);
  const recipientValidation = validateAddress(recipient);

  if (!senderValidation.isValid) {
    throw new Error(`Invalid sender address: ${sender}`);
  }
  if (!recipientValidation.isValid) {
    throw new Error(`Invalid recipient address: ${recipient}`);
  }

  const method = isTokenTransfer ? Methods.InvokeEVM : Methods.Transfer;

  let finalRecipient = recipientValidation.parsedAddress.toString();
  let params: string | undefined = undefined;

  if (isTokenTransfer && tokenContractAddress) {
    const contractValidation = validateAddress(tokenContractAddress);
    if (!contractValidation.isValid) {
      throw new Error(`Invalid token contract address: ${tokenContractAddress}`);
    }
    finalRecipient = contractValidation.parsedAddress.toString();
    const abiEncoded = generateTokenTxnParams(
      recipient,
      new BigNumber(transactionIntent.amount.toString()),
    );
    params = encodeTxnParams(abiEncoded);
  }

  const feeRequest: EstimatedFeesRequest = {
    to: finalRecipient,
    from: senderValidation.parsedAddress.toString(),
    methodNum: method,
    blockIncl: BroadcastBlockIncl,
  };
  if (isTokenTransfer && params) {
    feeRequest.params = params;
    feeRequest.value = "0";
  }
  const feesResponse = await fetchEstimatedFees(feeRequest);

  const gasFeeCap = new BigNumber(feesResponse.gas_fee_cap);
  const gasLimit = new BigNumber(feesResponse.gas_limit);
  const totalFee = calculateEstimatedFees(gasFeeCap, gasLimit);

  return {
    value: BigInt(totalFee.toFixed(0)),
    parameters: {
      gasLimit: feesResponse.gas_limit,
      gasFeeCap: feesResponse.gas_fee_cap,
      gasPremium: feesResponse.gas_premium,
      nonce: feesResponse.nonce,
    },
  };
}
