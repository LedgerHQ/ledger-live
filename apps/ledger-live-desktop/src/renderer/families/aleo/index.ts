import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import StepSummaryAmountRow from "./modals/send/steps/StepSummaryAmountRow";
import StepSummaryNetworkFeesRow from "./modals/send/steps/StepSummaryNetworkFeesRow";
import StepSummaryPostAlert from "./modals/send/steps/StepSummaryPostAlert";
import operationDetails from "./operationDetails";
import openSendFlow from "./openSendFlow";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  ModularDrawerAddAccountFlowManager,
  accountHeaderManageActions,
  openSendFlow,
  operationDetails,
  StepSummaryAmountRow,
  StepSummaryNetworkFeesRow,
  StepSummaryPostAlert,
};

export default family;
