import {
  TonOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/ton/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, TonOperation> = {
  operationDetails,
  AccountSubHeader,
  sendAmountFields,
  getTransactionExplorer: (explorerView, operation) =>
    explorerView &&
    explorerView.tx &&
    explorerView.tx.replace("$hash", operation.extra.explorerHash),
};

export default family;
