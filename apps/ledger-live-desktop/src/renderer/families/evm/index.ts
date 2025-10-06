import { getMessageProperties } from "@ledgerhq/coin-evm/logic";
import shouldUseReceiveOptions from "@ledgerhq/live-common/families/evm/shouldUseReceiveOptions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountFooter from "./AccountFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import transactionConfirmFields from "./TransactionConfirmFields";
import { EvmFamily } from "./types";

const family: EvmFamily = {
  AccountBodyHeader,
  AccountFooter,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendAmountFields,
  shouldUseReceiveOptions,
  StepSummaryNetworkFeesRow,
  message: {
    getMessageProperties,
  },
};

export default family;
