import { InputEntryFunctionData, RawTransaction } from "@aptos-labs/ts-sdk";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "./api";
import { APTOS_ASSET_ID } from "./constants";
import {
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  getMaxSendBalance,
  normalizeTransactionOptions,
} from "./logic";
import type { Transaction } from "./types";

const buildTransaction = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<RawTransaction> => {
  const amount = transaction.useAllAmount
    ? getMaxSendBalance(
        account.spendableBalance,
        new BigNumber(DEFAULT_GAS),
        new BigNumber(DEFAULT_GAS_PRICE),
      )
    : transaction.amount;

  const txPayload = getPayload(transaction.recipient, amount);
  const txOptions = normalizeTransactionOptions(transaction.options);
  const tx = await aptosClient.generateTransaction(account.freshAddress, txPayload, txOptions);

  return tx;
};

const getPayload = (sendTo: string, amount: BigNumber): InputEntryFunctionData => {
  return {
    function: "0x1::aptos_account::transfer_coins",
    typeArguments: [APTOS_ASSET_ID],
    functionArguments: [sendTo, amount.toString()],
  };
};

export default buildTransaction;
