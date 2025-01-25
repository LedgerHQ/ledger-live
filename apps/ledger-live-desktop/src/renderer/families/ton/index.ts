import {
  TonOperation,
  Transaction,
  TransactionStatus,
  TonOperationExtra,
} from "@ledgerhq/live-common/families/ton/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";
import operationDetails from "./operationDetails";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, TonOperation> = {
  operationDetails,
  AccountSubHeader,
  sendRecipientFields,
  getTransactionExplorer: (explorerView, operation) => {
    const operationExtra = operation.extra as TonOperationExtra;
    return (
      explorerView &&
      explorerView.tx &&
      explorerView.tx.replace(
        "$hash",
        operationExtra.explorerHash && operationExtra.explorerHash !== ""
          ? operationExtra.explorerHash
          : `by-msg-hash/${operation.hash}`,
      )
    );
  },
};

export default family;
