import {
  TezosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import accountActions from "./accountActions";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import transactionConfirmFields from "./TransactionConfirmFields";
import AccountBodyHeader from "./AccountBodyHeader";
import sendWarning from "./SendWarning";
import receiveWarning from "./ReceiveWarning";

const family: LLDCoinFamily<TezosAccount, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  accountActions,
  accountHeaderManageActions,
  modals,
  transactionConfirmFields,
  sendWarning,
  receiveWarning,
  AccountBodyHeader,
};

export default family;
