import { isValidAddress } from "@celo/utils/lib/address";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CELO_STABLE_TOKENS } from "../constants";
import { celoKit } from "../network/sdk";
import { CeloAccount, Transaction } from "../types";
import getFeesForTransaction from "./getFeesForTransaction";

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

  const amount =
    transaction.useAllAmount && isTokenTransaction ? tokenAccount.balance : transaction.amount;

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
