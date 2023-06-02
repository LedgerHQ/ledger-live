import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import tokenList from "./TokenList";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  operationDetails,
  transactionConfirmFields,
  AccountSubHeader,
  sendAmountFields,
  sendRecipientFields,
  tokenList,
};

export default family;
