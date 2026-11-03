import {
  Transaction,
  TransactionStatus,
  XrpOperation,
} from "@ledgerhq/live-common/families/xrp/types";
import { LLDCoinFamily } from "../types";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendRecipientFields from "./SendRecipientFields";
import operationDetails from "./operationDetails";
import tokenList from "./TokenList";
import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, XrpOperation> = {
  AccountBalanceSummaryFooter,
  accountHeaderManageActions,
  operationDetails,
  sendRecipientFields,
  sendRecipientCanNext: status => !status.errors.transaction,
  tokenList,
  modalsToPreload: ["MODAL_XRP_ADD_TOKEN"],
};

export default family;
