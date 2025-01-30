import { Transaction, TransactionStatus, EvmAccount } from "@ledgerhq/coin-evm/types/index";
import { Operation } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";

export type EvmFamily = LLDCoinFamily<EvmAccount, Transaction, TransactionStatus, Operation>;
