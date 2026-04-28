import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { encodeFunctionData, isAddress } from "viem";
import { ERC20_ABI } from "../network/abis";
import { CeloAccount, Transaction } from "../types";
import getFeesForTransaction from "./getFeesForTransaction";
import { isSameTokenAsFee } from "./utils";

export const prepareTransaction: AccountBridge<
  Transaction,
  CeloAccount
>["prepareTransaction"] = async (account, transaction) => {
  if (transaction.recipient && !isAddress(transaction.recipient)) return transaction;

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

  const shouldSubtractFee = isSameTokenAsFee(
    isTokenTransaction,
    tokenAccount?.token?.contractAddress,
    transaction.feeCurrencyUnwrapped,
  );

  const amount =
    transaction.useAllAmount && isTokenTransaction && !shouldSubtractFee
      ? tokenAccount?.spendableBalance
      : transaction.amount;

  if (isTokenTransaction) {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [transaction.recipient as `0x${string}`, BigInt(amount.toFixed())],
    });

    return {
      ...transaction,
      amount,
      fees,
      data: Buffer.from(data.slice(2), "hex"),
    };
  }

  return {
    ...transaction,
    amount,
    fees,
  };
};

export default prepareTransaction;
