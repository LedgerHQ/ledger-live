import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { isFilEthAddress, validateAddress } from "./bridge/utils/addresses";
import { BroadcastBlockIncl } from "./bridge/utils/types";
import { Methods, calculateEstimatedFees } from "./utils";
import { fetchEstimatedFees } from "./bridge/utils/api";
import { getAddress, getSubAccount } from "./bridge/utils/utils";
import { Transaction } from "./types";
import { generateTokenTxnParams } from "./bridge/utils/erc20/tokenAccounts";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const { balance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount } = transaction;

  const subAccount = getSubAccount(account, transaction);
  const tokenAccountTxn = !!subAccount;

  if (recipient && address) {
    const recipientValidation = validateAddress(recipient);
    const senderValidation = validateAddress(address);

    if (recipientValidation.isValid && senderValidation.isValid) {
      const patch: Partial<Transaction> = {};

      const method =
        isFilEthAddress(recipientValidation.parsedAddress) || tokenAccountTxn
          ? Methods.InvokeEVM
          : Methods.Transfer;

      const validatedContractAddress = validateAddress(subAccount?.token.contractAddress ?? "");
      const finalRecipient =
        tokenAccountTxn && validatedContractAddress.isValid
          ? validatedContractAddress
          : recipientValidation;

      const result = await fetchEstimatedFees({
        to: finalRecipient.parsedAddress.toString(),
        from: senderValidation.parsedAddress.toString(),
        methodNum: method,
        blockIncl: BroadcastBlockIncl,
      });

      patch.gasFeeCap = new BigNumber(result.gas_fee_cap);
      patch.gasPremium = new BigNumber(result.gas_premium);
      patch.gasLimit = new BigNumber(result.gas_limit);
      patch.nonce = result.nonce;
      patch.method = method;
      patch.params =
        tokenAccountTxn && transaction.amount.gt(0)
          ? await generateTokenTxnParams(recipient, transaction.amount)
          : "";

      const fee = calculateEstimatedFees(patch.gasFeeCap, patch.gasLimit);
      if (useAllAmount) {
        patch.amount = subAccount ? subAccount.spendableBalance : balance.minus(fee);
        patch.params =
          tokenAccountTxn && patch.amount.gt(0)
            ? await generateTokenTxnParams(recipient, patch.amount)
            : "";
      }

      return defaultUpdateTransaction(transaction, patch);
    }
  }

  return transaction;
};
