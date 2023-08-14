import {
  PolkadotAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const family: LLDCoinFamily<PolkadotAccount, Transaction, TransactionStatus> = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
};

export default family;
