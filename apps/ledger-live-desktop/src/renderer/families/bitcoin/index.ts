import "./live-common-setup";
import { LLDCoinFamily } from "../types";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";

const family: LLDCoinFamily<BitcoinAccount, Transaction, TransactionStatus> = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
};

export default family;
