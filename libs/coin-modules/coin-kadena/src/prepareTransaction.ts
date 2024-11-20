import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fetchChainBalances } from "./api/network";
import { KDA_FEES, KDA_GAS_LIMIT_TRANSFER } from "./constants";
import { Transaction } from "./types";
import { baseUnitToKda, findChainById, validateAddress } from "./utils";

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

        const chains = await fetchChainBalances(address);
        const senderChain = findChainById(chains, transaction.senderChainId);

        if (senderChain?.balance === undefined) {
          return { ...transaction, amount: new BigNumber(0) };
        }

        amount = baseUnitToKda(senderChain.balance).minus(fees);
        return { ...transaction, amount };
      }
    }
  }

  // log("debug", "[prepareTransaction] finish fn");
  return transaction;
};
