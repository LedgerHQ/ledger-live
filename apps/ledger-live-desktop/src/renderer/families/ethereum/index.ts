import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StakeBanner from "./StakeBanner";
import transactionConfirmFields from "./TransactionConfirmFields";
import operationDetails from "./operationDetails";
import { EthereumFamily } from "./types";

const family: EthereumFamily = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendAmountFields,
  StakeBanner,
};

export default family;
