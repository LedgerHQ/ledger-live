import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/types/index";

import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";

export type EvmFamily = LLDCoinFamily<Account, Transaction, TransactionStatus>;
