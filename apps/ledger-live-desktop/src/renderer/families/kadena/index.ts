import {
  KadenaOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/kadena/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, KadenaOperation> = {
  AccountSubHeader,
  sendRecipientFields,
  operationDetails,
};

export default family;
