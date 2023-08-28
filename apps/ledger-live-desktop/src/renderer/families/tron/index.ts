import {
  TronAccount,
  Transaction,
  TransactionStatus,
  TronOperation,
} from "@ledgerhq/live-common/families/tron/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";

const family: LLDCoinFamily<TronAccount, Transaction, TransactionStatus, TronOperation> = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StepReceiveFundsPostAlert,
};

export default family;
