import {
  SolanaAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type SolanaFamily = LLDCoinFamily<SolanaAccount, Transaction, TransactionStatus>;
export type SolanaFieldComponentProps = FieldComponentProps<
  SolanaAccount,
  Transaction,
  TransactionStatus
>;
