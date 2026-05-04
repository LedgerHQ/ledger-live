import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountFooter from "./AccountFooter";
import sendRecipientFields from "./SendRecipientFields";
import { CeloFamily } from "./types";

const family: CeloFamily = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  sendRecipientFields,
  AccountFooter,
};

export default family;
