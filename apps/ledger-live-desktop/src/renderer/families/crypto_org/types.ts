import {
  CryptoOrgAccount,
  CryptoOrgOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/crypto_org/types";
import { LLDCoinFamily } from "../types";

export type CryptoOrgFamily = LLDCoinFamily<
  CryptoOrgAccount,
  Transaction,
  TransactionStatus,
  CryptoOrgOperation
>;
