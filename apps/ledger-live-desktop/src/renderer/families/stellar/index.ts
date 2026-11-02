import operationDetails from "./operationDetails";
import transactionConfirmFields from "./TransactionConfirmFields";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import tokenList from "./TokenList";
import addAssetAction from "./addAssetAction";
import { StellarFamily } from "./types";

const family: StellarFamily = {
  operationDetails,
  transactionConfirmFields,
  sendAmountFields,
  sendRecipientFields,
  tokenList,
  addAssetAction,
  modalsToPreload: ["MODAL_STELLAR_ADD_ASSET"],
};

export default family;
