import {
  getTransactionExplorer,
  sendRecipientCanNext,
} from "@ledgerhq/live-common/families/hedera/utils";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import NoAssociatedAccounts from "./NoAssociatedAccounts";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveAccountCustomAlert from "./StepReceiveAccountCustomAlert";
import StepRecipientCustomAlert from "./StepRecipientCustomAlert";
import StepReceiveFunds from "./StepReceiveFunds";
import { HederaFamily } from "./types";
import tokenList from "./TokenList";
import operationDetails from "./OperationDetails";

const family: HederaFamily = {
  sendRecipientFields,
  tokenList,
  operationDetails,
  AccountSubHeader,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
  accountHeaderManageActions,
  StepReceiveAccountCustomAlert,
  StepReceiveFunds,
  StepRecipientCustomAlert,
  NoAssociatedAccounts,
  getTransactionExplorer,
  sendRecipientCanNext,
  receiveTokensConfig: {
    networkFamily: "hedera",
  },
};

export default family;
