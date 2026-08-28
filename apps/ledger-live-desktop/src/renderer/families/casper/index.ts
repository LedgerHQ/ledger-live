import {
  CasperAccount,
  CasperOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/casper/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import transactionConfirmFields from "./TransactionConfirmFields";
import sendRecipientFields from "./SendRecipientFields";
import StepSummaryAdditionalRows from "./StepSummaryAdditionalRows";

const family: LLDCoinFamily<CasperAccount, Transaction, TransactionStatus, CasperOperation> = {
  operationDetails,
  AccountSubHeader,
  sendRecipientFields,
  sendAmountFields,
  transactionConfirmFields,
  StepSummaryAdditionalRows,
};

export default family;
