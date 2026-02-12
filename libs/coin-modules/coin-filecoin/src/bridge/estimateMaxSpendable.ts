import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import {
  InvalidAddress,
  NotEnoughBalanceInParentAccount,
  NotEnoughSpendableBalance,
} from "@ledgerhq/errors";
import { AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fetchBalances, fetchEstimatedFees } from "../api";
import { getAddress, getSubAccount } from "../common-logic";
import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
import { isFilEthAddress, validateAddress } from "../network";
import { BroadcastBlockIncl } from "../types";
import { Transaction } from "../types";
import { AccountType, Methods, calculateEstimatedFees } from "./utils";

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
  if (account.type === AccountType.TokenAccount) {
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

  const validatedContractAddress = validateAddress(subAccount?.token.contractAddress ?? "");
  if (tokenAccountTxn && !validatedContractAddress.isValid) {
    throw invalidAddressErr;
  }
  const contractAddress =
    tokenAccountTxn && validatedContractAddress.isValid
      ? validatedContractAddress.parsedAddress.toString()
      : "";
  const finalRecipient = tokenAccountTxn ? contractAddress : recipient;

  // If token transfer, the evm payload is required to estimate fees
  const params =
    tokenAccountTxn && transaction && subAccount
      ? generateTokenTxnParams(
          contractAddress,
          transaction.amount.isZero() ? BigNumber(1) : transaction.amount,
        )
      : undefined;

  const result = await fetchEstimatedFees({
    to: finalRecipient,
    from: sender,
    methodNum,
    blockIncl: BroadcastBlockIncl,
    ...(params && { params: encodeTxnParams(params) }), // If token transfer, the eth call params are required to estimate fees
    ...(tokenAccountTxn && { value: "0" }), // If token transfer, the value should be 0 (avoid any native token transfer on fee estimation)
  });

  const gasFeeCap = new BigNumber(result.gas_fee_cap);
  const gasLimit = new BigNumber(result.gas_limit);
  const estimatedFees = calculateEstimatedFees(gasFeeCap, gasLimit);

  if (balance.lte(estimatedFees)) {
    if (tokenAccountTxn) {
      throw new NotEnoughBalanceInParentAccount(undefined, {
        currencyName: a.currency.name,
      });
    }

    throw new NotEnoughSpendableBalance(undefined, {
      currencyName: a.currency.name,
    });
  }
  balance = balance.minus(estimatedFees);

  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance;
  }
  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
};
