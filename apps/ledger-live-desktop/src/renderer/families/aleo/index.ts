import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import SendStepRecipient from "./SendStepRecipient";
import operationDetails from "./operationDetails";
import StepSummaryAmountRow from "./StepSummaryAmountRow";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import StepSummaryPostAlert from "./StepSummaryPostAlert";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  ModularDrawerAddAccountFlowManager,
  SendStepRecipient,
  accountHeaderManageActions,
  operationDetails,
  StepSummaryAmountRow,
  StepSummaryNetworkFeesRow,
  StepSummaryPostAlert,
};

export default family;
