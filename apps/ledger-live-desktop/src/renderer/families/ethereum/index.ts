import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StakeBanner from "./StakeBanner";
import transactionConfirmFields from "./TransactionConfirmFields";
import operationDetails from "./operationDetails";
import AccountFooter from "./AccountFooter";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";

import { EthereumFamily } from "./types";

const family: EthereumFamily = {
  AccountFooter,
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendAmountFields,
  StepSummaryNetworkFeesRow,
  StakeBanner,
};

export default family;
