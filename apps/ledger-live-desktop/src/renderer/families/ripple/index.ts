import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ripple/types";
import { LLDCoinFamily } from "../types";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  sendAmountFields,
  sendRecipientFields,
};

export default family;
