import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountSubHeader from "./AccountSubHeader";
import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import transactionConfirmFields from "./TransactionConfirmFields";
import { StacksFamily } from "./types";

const family: StacksFamily = {
  AccountSubHeader,
  operationDetails,
  sendRecipientFields,
  transactionConfirmFields,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  modalsToPreload: ["MODAL_STACKS_STAKE", "MODAL_STACKS_UNSTAKE"],
};

export default family;
