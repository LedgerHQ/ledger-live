import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import SendStepAmount from "./SendStepAmount";
import SendStepRecipient from "./SendStepRecipient";
import operationDetails from "./operationDetails";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  ModularDrawerAddAccountFlowManager,
  SendStepAmount,
  SendStepRecipient,
  accountHeaderManageActions,
  operationDetails,
};

export default family;
