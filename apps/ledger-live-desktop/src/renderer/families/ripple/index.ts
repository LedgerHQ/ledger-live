import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ripple/types";
import { LLDCoinFamily } from "../types";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import { Account, Operation } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, Operation> = {
  sendAmountFields,
  sendRecipientFields,
};

export default family;
