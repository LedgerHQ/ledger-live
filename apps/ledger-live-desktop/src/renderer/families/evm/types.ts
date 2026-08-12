import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/evm/types";
import { Account, Operation } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";

export type EvmFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, Operation>;
