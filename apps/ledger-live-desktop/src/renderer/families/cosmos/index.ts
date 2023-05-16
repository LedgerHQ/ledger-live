import {
  CosmosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import sendRecipientFields from "./SendRecipientFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";

const family: LLDCoinFamily<CosmosAccount, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  AccountBodyHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
