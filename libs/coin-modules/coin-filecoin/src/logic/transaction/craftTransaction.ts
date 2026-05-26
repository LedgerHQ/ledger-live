import type {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { fetchEstimatedFees } from "../../api/api";
import { encodeTxnParams, generateTokenTxnParams } from "../../erc20/tokenAccounts";
import { validateAddress } from "../../network";
import type { BroadcastTransactionRequest, EstimatedFeesRequest } from "../../types";
import { BroadcastBlockIncl } from "../../types";
import { calculateEstimatedFees, Methods } from "../../common-logic/fees";

/**
 * Crafts an unsigned Filecoin transaction message from a `TransactionIntent`.
 *
 * For native FIL transfers: method 0 (Transfer).
 * For ERC-20 token transfers: method 3844450837 (InvokeEVM), with ABI-encoded
 * transfer(address, uint256) payload CBOR-wrapped in params.
 *
 * Returns a `CraftedTransaction` with:
 *   - `transaction`: JSON string of the Filecoin message
 *   - `details`: gas parameters for fee display and override
 */
export async function craftTransaction(
  transactionIntent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if ("intentType" in transactionIntent && transactionIntent.intentType === "staking") {
    throw new Error("Staking transactions are not supported on Filecoin");
  }

  const { sender, recipient, amount, asset } = transactionIntent;

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

  let params: string | undefined = undefined;
  let finalRecipient = recipientValidation.parsedAddress.toString();
  let value = amount.toString();

  if (isTokenTransfer && tokenContractAddress) {
    const contractValidation = validateAddress(tokenContractAddress);
    if (!contractValidation.isValid) {
      throw new Error(`Invalid token contract address: ${tokenContractAddress}`);
    }
    finalRecipient = contractValidation.parsedAddress.toString();
    const abiEncoded = generateTokenTxnParams(recipient, new BigNumber(amount.toString()));
    params = encodeTxnParams(abiEncoded);
    value = "0";
  }

  let gasLimit: number;
  let gasFeeCap: string;
  let gasPremium: string;
  let nonce: number;

  if (customFees?.parameters) {
    const p = customFees.parameters as Record<string, unknown>;
    gasLimit = Number(p["gasLimit"] ?? 0);
    gasFeeCap = String(p["gasFeeCap"] ?? "0");
    gasPremium = String(p["gasPremium"] ?? "0");
    nonce = Number(p["nonce"] ?? 0);
  } else {
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
    gasLimit = feesResponse.gas_limit;
    gasFeeCap = feesResponse.gas_fee_cap;
    gasPremium = feesResponse.gas_premium;
    nonce = feesResponse.nonce;
  }

  const message: BroadcastTransactionRequest["message"] = {
    version: 0,
    to: finalRecipient,
    from: senderValidation.parsedAddress.toString(),
    nonce,
    value,
    gaslimit: gasLimit,
    gasfeecap: gasFeeCap,
    gaspremium: gasPremium,
    method,
    params: params ?? "",
  };

  // Compute fees for the details record (informational only)
  void calculateEstimatedFees(new BigNumber(gasFeeCap), new BigNumber(gasLimit));

  return {
    transaction: JSON.stringify(message),
    details: {
      gasLimit,
      gasFeeCap,
      gasPremium,
      nonce,
    },
  };
}
