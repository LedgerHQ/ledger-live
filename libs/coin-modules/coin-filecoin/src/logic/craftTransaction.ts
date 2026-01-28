import { Message } from "iso-filecoin/message";
import { validateAddress } from "../network/addresses";
import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
import { Methods } from "./common";
import type { CraftTransactionInput } from "../types/model";
import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";

/**
 * Craft an unsigned Filecoin transaction.
 *
 * For native FIL transfers, creates a simple transfer message.
 * For ERC20 token transfers, creates an InvokeEVM message with encoded transfer params.
 *
 * @param input - Transaction input parameters
 * @returns CraftedTransaction with serialized message
 */
export async function craftTransaction(input: CraftTransactionInput): Promise<CraftedTransaction> {
  const {
    sender,
    recipient,
    amount,
    nonce,
    gasFeeCap,
    gasPremium,
    gasLimit,
    tokenContractAddress,
  } = input;

  // Validate addresses
  const senderValidation = validateAddress(sender);
  const recipientValidation = validateAddress(recipient);

  if (!senderValidation.isValid) {
    throw new Error("Invalid sender address");
  }
  if (!recipientValidation.isValid) {
    throw new Error("Invalid recipient address");
  }

  // Determine method and params for token vs native transfer
  let method = Methods.Transfer;
  let encodedParams: string | undefined;
  let finalRecipient = recipientValidation.parsedAddress.toString();
  let finalAmount = amount.toString();

  if (tokenContractAddress) {
    const contractValidation = validateAddress(tokenContractAddress);
    if (!contractValidation.isValid) {
      throw new Error("Invalid token contract address");
    }

    method = Methods.InvokeEVM;
    // Generate ERC20 transfer params
    const abiEncodedParams = generateTokenTxnParams(recipient, new BigNumber(amount.toString()));
    encodedParams = encodeTxnParams(abiEncodedParams);
    finalRecipient = contractValidation.parsedAddress.toString();
    finalAmount = "0"; // Token transfers send 0 FIL to the contract
  }

  const parsedSender = senderValidation.parsedAddress.toString();

  // Create the Filecoin message
  const message = new Message({
    to: finalRecipient,
    from: parsedSender,
    gasFeeCap: gasFeeCap?.toString() ?? "0",
    gasLimit: Number(gasLimit ?? 0n),
    gasPremium: gasPremium?.toString() ?? "0",
    method,
    nonce,
    params: encodedParams,
    version: 0,
    value: finalAmount,
  });

  // Serialize to CBOR
  const txPayload = message.serialize();

  // Build transaction details for combine()
  const details = {
    nonce,
    method,
    sender: parsedSender,
    recipient: finalRecipient,
    params: encodedParams ?? "",
    value: finalAmount,
    gasFeeCap: gasFeeCap?.toString() ?? "0",
    gasPremium: gasPremium?.toString() ?? "0",
    gasLimit: gasLimit?.toString() ?? "0",
  };

  // Return as CraftedTransaction
  // transaction: JSON string containing txPayload + details for combine()
  const txData = {
    txPayload: txPayload.toString("hex"),
    details,
  };

  return {
    transaction: JSON.stringify(txData),
    details,
  };
}
