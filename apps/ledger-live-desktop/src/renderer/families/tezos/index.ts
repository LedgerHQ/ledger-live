import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import receiveWarning from "./ReceiveWarning";
import sendWarning from "./SendWarning";
import transactionConfirmFields from "./TransactionConfirmFields";
import accountActions from "./accountActions";
import operationDetails from "./operationDetails";
import { TezosFamily } from "./types";

const family: TezosFamily = {
  operationDetails,
  accountActions,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendWarning,
  receiveWarning,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
  modalsToPreload: [
    "MODAL_DELEGATE",
    "MODAL_TEZOS_EARNING_CHOICE",
    "MODAL_TEZOS_STAKE",
    "MODAL_TEZOS_UNSTAKE",
    "MODAL_TEZOS_UNSTAKE_REQUIRED",
  ],
};

export default family;
