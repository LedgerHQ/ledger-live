import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountHeaderActions from "./AccountHeaderActions";
import CustomMetadataCell from "./CustomMetadataCell";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import StepRecipient from "./shared/StepRecipient";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  accountHeaderManageActions: AccountHeaderActions,
  CustomMetadataCell,
  ModularDrawerAddAccountFlowManager,
  StepRecipient,
};

export default family;
