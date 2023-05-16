import {
  CeloAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/celo/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const family: LLDCoinFamily<CeloAccount, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
};

export default family;
