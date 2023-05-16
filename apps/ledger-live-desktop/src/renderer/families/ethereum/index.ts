import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ethereum/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import sendAmountFields from "./SendAmountFields";
import StakeBanner from "./StakeBanner";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  sendAmountFields,
  StakeBanner,
};

export default family;
