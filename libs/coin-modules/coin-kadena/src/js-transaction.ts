import BigNumber from "bignumber.js";
import { Transaction } from "./types";
import { Account } from "@ledgerhq/types-live";
import { getAddress, validateAddress, baseUnitToKda } from "./utils";
import { fetchCoinDetailsForAccount } from "./api/network";
import { KDA_FEES, KDA_GAS_LIMIT_TRANSFER } from "./constants";

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

export const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(a);
  const { recipient } = t;

  let amount: BigNumber = t.amount;
  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if (validateAddress(recipient) && validateAddress(address)) {
      if (t.useAllAmount) {
        let fees = t.gasPrice.multipliedBy(t.gasLimit);

        const balance = await fetchCoinDetailsForAccount(address, [
          t.senderChainId.toString(),
        ]);
        if (balance[t.senderChainId] === undefined) {
          return { ...t, amount: new BigNumber(0) };
        }
      

        amount = baseUnitToKda(balance[t.senderChainId]).minus(fees);
        return { ...t, amount };
      }
    }
  }

  // log("debug", "[prepareTransaction] finish fn");
  return t;
};

