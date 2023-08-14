import {
  CeloAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/celo/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const family: LLDCoinFamily<CeloAccount, Transaction, TransactionStatus> = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
};

export default family;
