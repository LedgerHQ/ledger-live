import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import tokenList from "./TokenList";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  modals,
  transactionConfirmFields,
  AccountSubHeader,
  sendAmountFields,
  sendRecipientFields,
  tokenList,
};

export default family;
