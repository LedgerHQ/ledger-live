import { EvmFamily } from "./types";
import { injectNftIntoTransaction, getNftTransactionProperties } from "./nft";
import AccountFooter from "./AccountFooter";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import StakeBanner from "./StakeBanner";
import { getMessageProperties } from "./message";

const family: EvmFamily = {
  AccountFooter,
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
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
