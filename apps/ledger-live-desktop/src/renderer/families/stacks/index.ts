import {
  StacksOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stacks/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import transactionConfirmFields from "./TransactionConfirmFields";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, StacksOperation> = {
  AccountSubHeader,
  operationDetails,
  sendRecipientFields,
  transactionConfirmFields,
};

export default family;
