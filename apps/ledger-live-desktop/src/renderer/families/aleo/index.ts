import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import operationDetails from "./operationDetails";
import type { AleoFamily } from "./types";
import StepRecipient from "./shared/StepRecipient";
import AccountHeaderActions from "./AccountHeaderActions";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  accountHeaderManageActions: AccountHeaderActions,
  ModularDrawerAddAccountFlowManager,
  operationDetails,
  StepRecipient,
};

export default family;
