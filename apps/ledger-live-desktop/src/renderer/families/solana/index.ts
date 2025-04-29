import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";
import StepSummaryAdditionalRows from "./StepSummaryAdditionalRows";
import { SolanaFamily } from "./types";
import operationDetails from "./operationDetails";
import sendAmountFields from "./SendAmountFields";
import transactionConfirmFields from "./TransactionConfirmFields";

const family: SolanaFamily = {
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountSubHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  StepSummaryAdditionalRows,
  StakeBanner,
  operationDetails,
  sendAmountFields,
  transactionConfirmFields,
};

export default family;
