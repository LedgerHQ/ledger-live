import {
  TronAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tron/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import { Operation } from "@ledgerhq/types-live";

const family: LLDCoinFamily<TronAccount, Transaction, TransactionStatus, Operation> = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StepReceiveFundsPostAlert,
};

export default family;
