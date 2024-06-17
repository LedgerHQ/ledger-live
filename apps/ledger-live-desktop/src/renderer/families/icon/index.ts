import AccountSubHeader from "./AccountSubHeader";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import {
  IconAccount,
  Transaction,
  TransactionStatus,
  IconOperation,
} from "@ledgerhq/live-common/families/icon/types";
import { LLDCoinFamily } from "../types";

const family: LLDCoinFamily<IconAccount, Transaction, TransactionStatus, IconOperation> = {
  AccountSubHeader,
  transactionConfirmFields,
  StepSummaryNetworkFeesRow,
  AccountBalanceSummaryFooter,
};

export default family;
