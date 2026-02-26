import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isValidAddress } from "@celo/utils/lib/address";
import getFeesForTransaction from "./getFeesForTransaction";
import { CeloAccount, Transaction } from "../types";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { CELO_STABLE_TOKENS } from "../constants";
import { celoKit } from "../network/sdk";
import { isSameTokenAsFee } from "./utils";

export const prepareTransaction: AccountBridge<
  Transaction,
  CeloAccount
>["prepareTransaction"] = async (account, transaction) => {
  const kit = celoKit();

  if (transaction.recipient && !isValidAddress(transaction.recipient)) return transaction;

  if (["send", "vote"].includes(transaction.mode) && !transaction.recipient) return transaction;

  if (
    transaction.mode === "vote" &&
    !transaction.useAllAmount &&
    new BigNumber(transaction.amount).lte(0)
  )
    return transaction;

  const fees = await getFeesForTransaction({ account, transaction });

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  let amount = transaction.amount;
  if (transaction.useAllAmount) {
    if (isTokenTransaction) {
      // Check if fee token matches send token
      const shouldSubtractFee = isSameTokenAsFee(
        isTokenTransaction,
        tokenAccount.token.contractAddress,
        transaction.feeCurrency,
      );
      amount = shouldSubtractFee
        ? BigNumber.max(0, tokenAccount.balance.minus(fees))
        : tokenAccount.balance;
    } else {
      // Native CELO transfer
      const shouldSubtractFee = isSameTokenAsFee(
        isTokenTransaction,
        undefined,
        transaction.feeCurrency,
      );
      amount = shouldSubtractFee
        ? BigNumber.max(0, account.spendableBalance.minus(fees))
        : account.spendableBalance;
    }
  }

  let token;
  if (isTokenTransaction) {
    if (CELO_STABLE_TOKENS.includes(tokenAccount.token.id)) {
      token = await kit.contracts.getStableToken();
    } else {
      token = await kit.contracts.getErc20(tokenAccount.token.contractAddress);
    }
  } else {
    token = await kit.contracts.getGoldToken();
  }

  return {
    ...transaction,
    amount,
    fees,
    ...(isTokenTransaction
      ? {
          data: Buffer.from(
            token.transfer(transaction.recipient, amount.toFixed()).txo.encodeABI(),
          ),
        }
      : {}),
  };
};

export default prepareTransaction;
