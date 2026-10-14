import type {
  HederaAccount,
  HederaGenericTransaction,
  HederaOperation,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import type { Account } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "../types";

export type HederaFamily = LLDCoinFamily<
  HederaAccount,
  HederaGenericTransaction,
  TransactionStatus,
  HederaOperation
>;

export type SendAmountProps = {
  account: Account;
  transaction: HederaGenericTransaction;
  status: TransactionStatus;
  onChange: (a: HederaGenericTransaction) => void;
  trackProperties?: object;
  autoFocus?: boolean;
};
