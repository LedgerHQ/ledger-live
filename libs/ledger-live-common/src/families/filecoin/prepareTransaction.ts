import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { isFilEthAddress, validateAddress } from "./bridge/utils/addresses";
import { BroadcastBlockIncl } from "./bridge/utils/types";
import { Methods, calculateEstimatedFees } from "./utils";
import { fetchEstimatedFees } from "./bridge/utils/api";
import { getAddress } from "./bridge/utils/utils";
import { Transaction } from "./types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const { balance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount } = transaction;

  if (recipient && address) {
    const recipientValidation = validateAddress(recipient);
    const senderValidation = validateAddress(address);

    if (recipientValidation.isValid && senderValidation.isValid) {
      const patch: Partial<Transaction> = {};

      const method = isFilEthAddress(recipientValidation.parsedAddress)
        ? Methods.InvokeEVM
        : Methods.Transfer;

      const result = await fetchEstimatedFees({
        to: recipientValidation.parsedAddress.toString(),
        from: senderValidation.parsedAddress.toString(),
        methodNum: method,
        blockIncl: BroadcastBlockIncl,
      });

      patch.gasFeeCap = new BigNumber(result.gas_fee_cap);
      patch.gasPremium = new BigNumber(result.gas_premium);
      patch.gasLimit = new BigNumber(result.gas_limit);
      patch.nonce = result.nonce;
      patch.method = method;

      const fee = calculateEstimatedFees(patch.gasFeeCap, patch.gasLimit);
      if (useAllAmount) patch.amount = balance.minus(fee);

      return defaultUpdateTransaction(transaction, patch);
    }
  }

  return transaction;
};
