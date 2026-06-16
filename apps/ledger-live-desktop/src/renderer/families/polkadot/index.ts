import {
  PolkadotAccount,
  PolkadotOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const family: LLDCoinFamily<PolkadotAccount, Transaction, TransactionStatus, PolkadotOperation> = {
  operationDetails,
  accountHeaderManageActions,
  transactionConfirmFields,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
  modalsToPreload: [
    "MODAL_POLKADOT_MANAGE",
    "MODAL_POLKADOT_REWARDS_INFO",
    "MODAL_POLKADOT_SIMPLE_OPERATION",
    "MODAL_POLKADOT_NOMINATE",
    "MODAL_POLKADOT_BOND",
    "MODAL_POLKADOT_UNBOND",
    "MODAL_POLKADOT_REBOND",
  ],
};

export default family;
