import {
  KadenaOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/kadena/types";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, KadenaOperation> = {
  AccountSubHeader,
  sendRecipientFields,
};

export default family;
