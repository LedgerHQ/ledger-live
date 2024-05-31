import { AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import { getMainAccount } from "../../account";
import { getAddress, getSubAccount } from "./bridge/utils/utils";
import { Methods, calculateEstimatedFees } from "./utils";
import { InvalidAddress } from "@ledgerhq/errors";
import { isFilEthAddress, validateAddress } from "./bridge/utils/addresses";
import { fetchBalances, fetchEstimatedFees } from "./bridge/utils/api";
import BigNumber from "bignumber.js";
import { BroadcastBlockIncl } from "./bridge/utils/types";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  // log("debug", "[estimateMaxSpendable] start fn");
  if (transaction && !transaction.subAccountId) {
    transaction.subAccountId = account.type === "Account" ? null : account.id;
  }

  let tokenAccountTxn: boolean = false;
  let subAccount: TokenAccount | undefined | null;
  const a = getMainAccount(account, parentAccount);
  if (account.type === "TokenAccount") {
    tokenAccountTxn = true;
    subAccount = account;
  }
  if (transaction && transaction.subAccountId && !subAccount) {
    tokenAccountTxn = true;
    subAccount = getSubAccount(a, transaction) ?? null;
  }

  let { address: sender } = getAddress(a);

  let methodNum = Methods.Transfer;
  let recipient = transaction?.recipient;

  const invalidAddressErr = new InvalidAddress(undefined, {
    currencyName: subAccount ? subAccount.token.name : a.currency.name,
  });
  const senderValidation = validateAddress(sender);
  if (!senderValidation.isValid) throw invalidAddressErr;
  sender = senderValidation.parsedAddress.toString();

  if (recipient) {
    const recipientValidation = validateAddress(recipient);
    if (!recipientValidation.isValid) {
      throw invalidAddressErr;
    }
    recipient = recipientValidation.parsedAddress.toString();

    methodNum =
      isFilEthAddress(recipientValidation.parsedAddress) || tokenAccountTxn
        ? Methods.InvokeEVM
        : Methods.Transfer;
  }

  let balance = new BigNumber((await fetchBalances(sender)).spendable_balance);

  if (balance.eq(0)) return balance;

  const amount = transaction?.amount;

  const validatedContractAddress = validateAddress(subAccount?.token.contractAddress ?? "");
  const finalRecipient =
    tokenAccountTxn && validatedContractAddress.isValid
      ? validatedContractAddress.parsedAddress.toString()
      : recipient;

  const result = await fetchEstimatedFees({
    to: finalRecipient,
    from: sender,
    methodNum,
    blockIncl: BroadcastBlockIncl,
  });
  const gasFeeCap = new BigNumber(result.gas_fee_cap);
  const gasLimit = new BigNumber(result.gas_limit);
  const estimatedFees = calculateEstimatedFees(gasFeeCap, gasLimit);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);
  if (amount) balance = balance.minus(amount);

  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance.minus(amount ?? 0);
  }
  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
};
