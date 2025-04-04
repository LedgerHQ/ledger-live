import { getMessageProperties } from "@ledgerhq/coin-evm/logic";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountFooter from "./AccountFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import transactionConfirmFields from "./TransactionConfirmFields";
import { getNftTransactionProperties, injectNftIntoTransaction } from "./nft";
import operationDetails from "./operationDetails";
import { EvmFamily } from "./types";

const family: EvmFamily = {
  AccountBodyHeader,
  AccountFooter,
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendAmountFields,
  StepSummaryNetworkFeesRow,
  nft: {
    getNftTransactionProperties,
    injectNftIntoTransaction,
  },
  message: {
    getMessageProperties,
  },
};

export default family;
