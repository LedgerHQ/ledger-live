import {
  SolanaAccount,
  SolanaOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type SolanaFamily = LLDCoinFamily<
  SolanaAccount,
  Transaction,
  TransactionStatus,
  SolanaOperation
>;
export type SolanaFieldComponentProps = FieldComponentProps<
  SolanaAccount,
  Transaction,
  TransactionStatus
>;
