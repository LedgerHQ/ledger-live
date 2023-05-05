import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import StepReceiveFunds from "./StepReceiveFunds";
import NoAssociatedAccounts from "./NoAssociatedAccounts";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  AccountSubHeader,
  sendAmountFields,
  StepReceiveFunds,
  NoAssociatedAccounts,
};

export default family;
