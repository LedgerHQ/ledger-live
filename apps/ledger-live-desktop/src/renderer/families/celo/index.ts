import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountFooter from "./AccountFooter";
import sendRecipientFields from "./SendRecipientFields";
import SendStepAmount from "./SendStepAmount";
import { CeloFamily } from "./types";

const family: CeloFamily = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  sendRecipientFields,
  SendStepAmount,
  AccountFooter,
  modalsToPreload: [
    "MODAL_CELO_REWARDS_INFO",
    "MODAL_CELO_MANAGE",
    "MODAL_CELO_LOCK",
    "MODAL_CELO_UNLOCK",
    "MODAL_CELO_VOTE",
    "MODAL_CELO_SIMPLE_OPERATION",
    "MODAL_CELO_WITHDRAW",
    "MODAL_CELO_ACTIVATE",
    "MODAL_CELO_REVOKE",
  ],
};

export default family;
