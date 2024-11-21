import AccountSubHeader from "./AccountSubHeader";
import NoAssociatedAccounts from "./NoAssociatedAccounts";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFunds from "./StepReceiveFunds";
import getTransactionExplorer from "./getTransactionExplorer";
import { HederaFamily } from "./types";

const family: HederaFamily = {
  AccountSubHeader,
  sendRecipientFields,
  StepReceiveFunds,
  NoAssociatedAccounts,
  getTransactionExplorer,
};

export default family;
