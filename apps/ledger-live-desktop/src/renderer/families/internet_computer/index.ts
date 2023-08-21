import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  operationDetails,
  AccountSubHeader,
  sendAmountFields,
};

export default family;
