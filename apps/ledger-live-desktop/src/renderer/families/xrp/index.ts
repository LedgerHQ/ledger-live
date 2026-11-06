import {
  Transaction,
  TransactionStatus,
  XrpOperation,
} from "@ledgerhq/live-common/families/xrp/types";
import { LLDCoinFamily } from "../types";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import operationDetails from "./operationDetails";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, XrpOperation> = {
  operationDetails,
  sendAmountFields,
  sendRecipientFields,
  sendRecipientCanNext: status => !status.errors.transaction,
};

export default family;
