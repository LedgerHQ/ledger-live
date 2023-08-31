import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import sendAmountFields from "./SendAmountFields";
import StakeBanner from "./StakeBanner";
import transactionConfirmFields from "./TransactionConfirmFields";
import operationDetails from "./operationDetails";
import AccountFooter from "./AccountFooter";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import {
  getNftTransactionProperties,
  injectNftIntoTransaction,
  getMessageProperties,
} from "./helpers";

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
  message: {
    getMessageProperties,
  },
};

export default family;
