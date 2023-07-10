import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/lib/types";
import { LLDCoinFamily } from "../types";
import {
  injectNftIntoTransaction,
  getNftTransactionProperties,
  getMessageProperties,
} from "./helpers";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  nft: {
    getNftTransactionProperties,
    injectNftIntoTransaction,
  },

  message: {
    getMessageProperties,
  },
};

export default family;
