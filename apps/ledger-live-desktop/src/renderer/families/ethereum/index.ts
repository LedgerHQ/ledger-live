import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ethereum/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import sendAmountFields from "./SendAmountFields";
import StakeBanner from "./StakeBanner";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  sendAmountFields,
  StakeBanner,
};

export default family;
