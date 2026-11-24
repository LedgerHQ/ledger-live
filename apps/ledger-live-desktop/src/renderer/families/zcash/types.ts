import type { Operation } from "@ledgerhq/types-live";
import type { ZcashAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-zcash/types";
import type { LLDCoinFamily } from "../types";

export type ZcashFamily = LLDCoinFamily<ZcashAccount, Transaction, TransactionStatus, Operation>;
