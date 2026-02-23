import "./live-common-setup";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import operationDetails from "./operationDetails";
import { BitcoinFamily } from "./types";

const family: BitcoinFamily = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  operationDetails,
};

export default family;
