import AccountSubHeader from "./AccountSubHeader";
import NoAssociatedAccounts from "./NoAssociatedAccounts";
import sendAmountFields from "./SendAmountFields";
import StepReceiveFunds from "./StepReceiveFunds";
import getTransactionExplorer from "./getTransactionExplorer";
import { HederaFamily } from "./types";

const family: HederaFamily = {
  AccountSubHeader,
  sendAmountFields,
  StepReceiveFunds,
  NoAssociatedAccounts,
  getTransactionExplorer,
};

export default family;
