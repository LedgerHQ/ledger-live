import {
  getMessageProperties,
  getNftTransactionProperties,
  injectNftIntoTransaction,
} from "./helpers";
import sendAmountFields from "./SendAmountFields";
import { EvmFamily } from "./types";

const family: EvmFamily = {
  sendAmountFields,
  nft: {
    getNftTransactionProperties,
    injectNftIntoTransaction,
  },
  message: {
    getMessageProperties,
  },
};

export default family;
