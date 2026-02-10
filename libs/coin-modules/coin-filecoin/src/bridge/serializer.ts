import { Account } from "@ledgerhq/types-live";

import BigNumber from "bignumber.js";
import { Message } from "iso-filecoin/message";
import { getAddress, getSubAccount } from "../common-logic/index";
import { encodeTxnParams } from "../erc20/tokenAccounts";
import { validateAddress } from "../network";
import { Transaction } from "../types";
import { AccountType } from "./utils";

export interface toCBORResponse {
  txPayload: Buffer;
  recipientToBroadcast: string;
  parsedSender: string;
  encodedParams: string;
  amountToBroadcast: BigNumber;
}

export const toCBOR = async (account: Account, tx: Transaction): Promise<toCBORResponse> => {
  const { address: from } = getAddress(account);
  const { method, version, nonce, gasLimit, gasPremium, gasFeeCap, amount, recipient } = tx;
  const recipientValidation = validateAddress(recipient);
  const fromValidation = validateAddress(from);

  const subAccount = getSubAccount(account, tx);
  const tokenTransfer = subAccount && subAccount.type === AccountType.TokenAccount;
  const params = tokenTransfer ? encodeTxnParams(tx.params ?? "") : undefined;

  if (!recipientValidation.isValid || !fromValidation.isValid)
    throw new Error("recipient and/or from address are not valid");

  let finalRecipient: string;
  if (tokenTransfer) {
    const validated = validateAddress(subAccount.token.contractAddress);
    if (!validated.isValid) throw new Error("token contract address is not valid");
    finalRecipient = validated.parsedAddress.toString();
  } else {
    finalRecipient = recipientValidation.parsedAddress.toString();
  }

  const finalAmount = tokenTransfer ? "0" : amount.toString();

  const message = new Message({
    to: finalRecipient,
    from: fromValidation.parsedAddress.toString(),
    gasFeeCap: gasFeeCap.toString(),
    gasLimit: gasLimit.toNumber(),
    gasPremium: gasPremium.toString(),
    method,
    nonce,
    params,
    version: version === 0 ? 0 : undefined,
    value: finalAmount,
  });

  return {
    txPayload: message.serialize(),
    recipientToBroadcast: finalRecipient,
    parsedSender: fromValidation.parsedAddress.toString(),
    encodedParams: params ?? "",
    amountToBroadcast: new BigNumber(finalAmount),
  };
};
