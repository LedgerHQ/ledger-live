import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import createSendSteps from "./createSendSteps";
import StepSummaryFromAddress from "./modals/send/steps/StepSummaryFromAddress";
import StepSummaryPostAlert from "./modals/send/steps/StepSummaryPostAlert";
import StepSummaryAdditionalRows from "./modals/send/steps/StepSummaryAdditionalRows";
import StepSummaryRecipientValue from "./modals/send/steps/StepSummaryRecipientValue";
import operationDetails from "./operationDetails";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  ModularDrawerAddAccountFlowManager,
  accountHeaderManageActions,
  createSendSteps,
  operationDetails,
  StepSummaryFromAddress,
  StepSummaryRecipientValue,
  StepSummaryPostAlert,
  StepSummaryAdditionalRows,
  modalsToPreload: ["MODAL_ALEO_SELF_TRANSFER"],
};

export default family;
