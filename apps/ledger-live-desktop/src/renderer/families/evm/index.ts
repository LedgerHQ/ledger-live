import { getMessageProperties } from "@ledgerhq/coin-evm/logic";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountFooter from "./AccountFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import transactionConfirmFields from "./TransactionConfirmFields";
import { EvmFamily } from "./types";

const family: EvmFamily = {
  operationDetails: {
    OperationDetailsExtra: () => null,
  },
  AccountBodyHeader,
  AccountFooter,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendAmountFields,
  StepSummaryNetworkFeesRow,
  message: {
    getMessageProperties,
  },
};

export default family;
