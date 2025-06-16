import {
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import { Account } from "@ledgerhq/types-live";
import sendRecipientFields from "./SendRecipientFields";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, InternetComputerOperation> = {
  operationDetails,
  AccountSubHeader,
  sendAmountFields,
  sendRecipientFields,
};

export default family;
