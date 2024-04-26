import {
  TonOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/ton/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import operationDetails from "./operationDetails";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, TonOperation> = {
  operationDetails,
  AccountSubHeader,
  sendAmountFields,
  getTransactionExplorer: (explorerView, operation) =>
    explorerView &&
    explorerView.tx &&
    explorerView.tx.replace(
      "$hash",
      operation.extra.explorerHash && operation.extra.explorerHash !== ""
        ? operation.extra.explorerHash
        : `by-msg-hash/${operation.hash}`,
    ),
};

export default family;
