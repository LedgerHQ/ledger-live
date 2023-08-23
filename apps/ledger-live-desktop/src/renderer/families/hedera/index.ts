import AccountSubHeader from "./AccountSubHeader";
import NoAssociatedAccounts from "./NoAssociatedAccounts";
import sendAmountFields from "./SendAmountFields";
import StepReceiveFunds from "./StepReceiveFunds";
import ExplorerLink from "./ExplorerLink";
import { HederaFamily } from "./types";

const family: HederaFamily = {
  AccountSubHeader,
  sendAmountFields,
  StepReceiveFunds,
  NoAssociatedAccounts,
  ExplorerLink,
};

export default family;
