import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/filecoin/types";
import { getTransactionExplorer } from "@ledgerhq/live-common/families/filecoin/utils";
import { LLDCoinFamily } from "../types";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountSubHeader from "./AccountSubHeader";
import { Account, Operation } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, Operation> = {
  transactionConfirmFields,
  AccountSubHeader,
  getTransactionExplorer,
};

export default family;
