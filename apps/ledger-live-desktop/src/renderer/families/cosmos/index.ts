import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendRecipientFields from "./SendRecipientFields";
import StakeBanner from "./StakeBanner";
import transactionConfirmFields from "./TransactionConfirmFields";
import modals from "./modals";
import operationDetails from "./operationDetails";
import { CosmosFamily } from "./types";

const family: CosmosFamily = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  AccountBodyHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
