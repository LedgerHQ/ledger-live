import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isValidAddress } from "@celo/utils/lib/address";
import getFeesForTransaction from "./getFeesForTransaction";
import { CeloAccount, Transaction } from "../types";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { ethers } from "ethers";
import { ERC20_ABI } from "../abis";

export const prepareTransaction: AccountBridge<
  Transaction,
  CeloAccount
>["prepareTransaction"] = async (account, transaction) => {
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

  const contract = new ethers.utils.Interface(ERC20_ABI);
  const data = contract.encodeFunctionData("transfer", [transaction.recipient, amount.toFixed()]);

  return {
    ...transaction,
    fees,
    amount,
    ...(isTokenTransaction && { data: Buffer.from(data.slice(2), "hex") }),
  };
};

export default prepareTransaction;
