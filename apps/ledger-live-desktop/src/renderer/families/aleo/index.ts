import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import SendBalanceTypeSync from "./SendBalanceTypeSync/SendBalanceTypeSync";
import operationDetails from "./operationDetails";
import SendAmountFooterRow from "./SendAmountFooterRow";
import transactionConfirmFields from "./TransactionConfirmFields";
import type { AleoFamily } from "./types";

const family: AleoFamily = {
  AccountBalanceSummaryFooter,
  AccountBodyHeader,
  ModularDrawerAddAccountFlowManager,
  accountHeaderManageActions,
  operationDetails,
  transactionConfirmFields,
  SendBalanceTypeSync,
  SendAmountFooterRow,
  modalsToPreload: [
    "MODAL_ALEO_BOND_PUBLIC",
    "MODAL_ALEO_MANAGE",
    "MODAL_ALEO_UNBOND",
    "MODAL_ALEO_CLAIM_UNBOND",
  ],
};

export default family;
