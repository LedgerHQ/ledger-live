import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { LLDCoinFamily } from "../types";

import AccountSubHeader from "./AccountSubHeader";

import { Account } from "@ledgerhq/types-live";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus> = {

  AccountSubHeader,

};

export default family;
