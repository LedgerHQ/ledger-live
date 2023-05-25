import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ethereum/types";

import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";

export type EthereumFamily = LLDCoinFamily<Account, Transaction, TransactionStatus>;
