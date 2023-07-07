import { getNftTransactionProperties, injectNftIntoTransaction } from "./helpers";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
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
  AccountBodyHeader,
  sendAmountFields,
  StepSummaryNetworkFeesRow,
  StakeBanner,
  nft: {
    getNftTransactionProperties,
    injectNftIntoTransaction,
  },
};

export default family;
