import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/filecoin/types";
import { LLDCoinFamily } from "../types";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountSubHeader from "./AccountSubHeader";
import { Account, Operation } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, Operation> = {
  transactionConfirmFields,
  AccountSubHeader,
};

export default family;
