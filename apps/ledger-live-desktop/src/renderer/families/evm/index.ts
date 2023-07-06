import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/lib/types";
import { injectNftIntoTransaction, getNftTransactionProperties } from "./helpers";
import { LLDCoinFamily } from "../types";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  nft: {
    getNftTransactionProperties,
    injectNftIntoTransaction,
  },
};

export default family;
