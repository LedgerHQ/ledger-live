import type {
  Transaction,
  TransactionStatus,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import type { Operation } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "../types";

export type ZcashFamily = LLDCoinFamily<ZcashAccount, Transaction, TransactionStatus, Operation>;
