import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import createSendSteps from "./createSendSteps";
import StepSummaryAmountRow from "./modals/send/steps/StepSummaryAmountRow";
import StepSummaryNetworkFeesRow from "./modals/send/steps/StepSummaryNetworkFeesRow";
import StepSummaryPostAlert from "./modals/send/steps/StepSummaryPostAlert";
import operationDetails from "./operationDetails";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  ModularDrawerAddAccountFlowManager,
  accountHeaderManageActions,
  createSendSteps,
  operationDetails,
  StepSummaryAmountRow,
  StepSummaryNetworkFeesRow,
  StepSummaryPostAlert,
};

export default family;
