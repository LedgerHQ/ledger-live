import "./live-common-setup";
import { LLDCoinFamily } from "../types";
import modals, { ModalsData } from "./modals";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";

const family: LLDCoinFamily<BitcoinAccount, Transaction, TransactionStatus, ModalsData> = {
  modals,
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
};

export default family;
