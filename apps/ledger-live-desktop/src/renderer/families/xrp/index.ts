import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { LLDCoinFamily } from "../types";
import sendRecipientFields from "./SendRecipientFields";
import { Account, Operation } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, Operation> = {
  sendRecipientFields,
};

export default family;
