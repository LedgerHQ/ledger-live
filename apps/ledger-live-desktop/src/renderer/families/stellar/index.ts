import operationDetails from "./operationDetails";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import tokenList from "./TokenList";
import { StellarFamily } from "./types";

const family: StellarFamily = {
  operationDetails,
  transactionConfirmFields,
  AccountSubHeader,
  sendAmountFields,
  sendRecipientFields,
  tokenList,
};

export default family;
