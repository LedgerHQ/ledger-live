import {
  PolkadotAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const family: LLDCoinFamily<PolkadotAccount, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
};

export default family;
