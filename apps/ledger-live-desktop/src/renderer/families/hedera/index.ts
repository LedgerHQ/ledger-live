import AccountSubHeader from "./AccountSubHeader";
import NoAssociatedAccounts from "./NoAssociatedAccounts";
import sendAmountFields from "./SendAmountFields";
import StepReceiveFunds from "./StepReceiveFunds";
import { HederaFamily } from "./types";

const family: HederaFamily = {
  AccountSubHeader,
  sendAmountFields,
  StepReceiveFunds,
  NoAssociatedAccounts,
};

export default family;
