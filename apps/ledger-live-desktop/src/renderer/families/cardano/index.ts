import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import { LLDCoinFamily } from "../types";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const family: LLDCoinFamily<CardanoAccount, Transaction, TransactionStatus> = {
  AccountBodyHeader,
  AccountSubHeader,
  sendAmountFields,
  AccountBalanceSummaryFooter,
};

export default family;
