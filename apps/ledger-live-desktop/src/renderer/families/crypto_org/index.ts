import {
  CryptoOrgAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/crypto_org/types";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";

const family: LLDCoinFamily<CryptoOrgAccount, Transaction, TransactionStatus> = {
  AccountSubHeader,
  sendRecipientFields,
};

export default family;
