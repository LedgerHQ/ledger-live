import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import operationDetails from "./operationDetails";
import AccountSubHeader from "./AccountSubHeader";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
//import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import { IconFamily } from "./types";

const family: IconFamily = {
  accountHeaderManageActions,
  operationDetails,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  //sendAmountFields,
  StepSummaryNetworkFeesRow,
  AccountBalanceSummaryFooter,
};

export default family;
