import { getTransactionExplorer } from "@ledgerhq/live-common/families/hedera/logic";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import NoAssociatedAccounts from "./NoAssociatedAccounts";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFunds from "./StepReceiveFunds";
import { HederaFamily } from "./types";

const family: HederaFamily = {
  AccountSubHeader,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
  accountHeaderManageActions,
  sendRecipientFields,
  StepReceiveFunds,
  NoAssociatedAccounts,
  getTransactionExplorer,
};

export default family;
