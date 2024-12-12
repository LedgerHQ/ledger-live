import { InputEntryFunctionData, RawTransaction } from "@aptos-labs/ts-sdk";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "./api";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, normalizeTransactionOptions } from "./logic";
import type { Transaction } from "./types";

const buildTransaction = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<RawTransaction> => {
  const amount = transaction.useAllAmount
    ? getMaxSendBalance(
        account.spendableBalance,
        new BigNumber(DEFAULT_GAS + 2000),
        new BigNumber(DEFAULT_GAS_PRICE),
      )
    : transaction.amount;

  const txPayload = getPayload(transaction.recipient, amount);
  const txOptions = normalizeTransactionOptions(transaction.options);
  const tx = await aptosClient.generateTransaction(account.freshAddress, txPayload, txOptions);

  return tx;
};

const getMaxSendBalance = (amount: BigNumber, gas: BigNumber, gasPrice: BigNumber) => {
  const totalGas = new BigNumber(gas).multipliedBy(BigNumber(gasPrice));

  if (amount.gt(totalGas)) return amount.minus(totalGas);
  return amount;
};

const getPayload = (sendTo: string, amount: BigNumber): InputEntryFunctionData => {
  return {
    function: "0x1::aptos_account::transfer_coins",
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [sendTo, amount.toString()],
  };
};

export default buildTransaction;
