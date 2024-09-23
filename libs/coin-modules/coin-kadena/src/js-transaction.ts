import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fetchCoinDetailsForAccount } from "./api/network";
import { KDA_FEES, KDA_GAS_LIMIT_TRANSFER } from "./constants";
import { Transaction } from "./types";
import { baseUnitToKda, validateAddress } from "./utils";

export const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "kadena",
    amount: new BigNumber(0),
    gasLimit: KDA_GAS_LIMIT_TRANSFER,
    gasPrice: KDA_FEES,
    recipient: "",
    useAllAmount: false,
    receiverChainId: 0,
    senderChainId: 0,
  };
};

export const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const address = account.freshAddress;
  const { recipient } = transaction;

  let amount: BigNumber = transaction.amount;
  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if (validateAddress(recipient) && validateAddress(address)) {
      if (transaction.useAllAmount) {
        const fees = transaction.gasPrice.multipliedBy(transaction.gasLimit);

        const balance = await fetchCoinDetailsForAccount(address, [
          transaction.senderChainId.toString(),
        ]);
        if (balance[transaction.senderChainId] === undefined) {
          return { ...transaction, amount: new BigNumber(0) };
        }

        amount = baseUnitToKda(balance[transaction.senderChainId]).minus(fees);
        return { ...transaction, amount };
      }
    }
  }

  // log("debug", "[prepareTransaction] finish fn");
  return transaction;
};
