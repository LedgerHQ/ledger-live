import {
  AlgorandAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/algorand/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import tokenList from "./TokenList";

const family: LLDCoinFamily<AlgorandAccount, Transaction, TransactionStatus> = {
  operationDetails,
  tokenList,
  accountHeaderManageActions,
  AccountBodyHeader,
};

export default family;
