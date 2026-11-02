import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import transactionConfirmFields from "./TransactionConfirmFields";
import { StacksFamily } from "./types";

const family: StacksFamily = {
  operationDetails,
  sendRecipientFields,
  transactionConfirmFields,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  modalsToPreload: ["MODAL_STACKS_STAKE", "MODAL_STACKS_UNSTAKE"],
};

export default family;
