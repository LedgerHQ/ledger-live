import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import { getMainAccount } from "../../account";
import { getAddress } from "./bridge/utils/utils";
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

  const mainAccount = getMainAccount(account, parentAccount);
  let { address: sender } = getAddress(mainAccount);

  let methodNum = Methods.Transfer;
  let recipient = transaction?.recipient;

  const invalidAddressErr = new InvalidAddress(undefined, {
    currencyName: mainAccount.currency.name,
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

    methodNum = isFilEthAddress(recipientValidation.parsedAddress)
      ? Methods.InvokeEVM
      : Methods.Transfer;
  }

  const balances = await fetchBalances(sender);
  let balance = new BigNumber(balances.spendable_balance);

  if (balance.eq(0)) return balance;

  const amount = transaction?.amount;

  const result = await fetchEstimatedFees({
    to: recipient,
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

  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
};
