import "./live-common-setup";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import { BitcoinFamily } from "./types";

const family: BitcoinFamily = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
};

export default family;
