import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendRecipientFields from "./SendRecipientFields";
import transactionConfirmFields from "./TransactionConfirmFields";
import operationDetails from "./operationDetails";
import { CosmosFamily } from "./types";

const family: CosmosFamily = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  modalsToPreload: [
    "MODAL_COSMOS_DELEGATE",
    "MODAL_COSMOS_REWARDS_INFO",
    "MODAL_COSMOS_CLAIM_REWARDS",
    "MODAL_COSMOS_REDELEGATE",
    "MODAL_COSMOS_UNDELEGATE",
  ],
};

export default family;
