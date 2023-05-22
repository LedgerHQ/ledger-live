import {
  SolanaAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";
import { ModalsData } from "./modals";

export type SolanaFamily = LLDCoinFamily<SolanaAccount, Transaction, TransactionStatus, ModalsData>;
export type SolanaFieldComponentProps = FieldComponentProps<
  SolanaAccount,
  Transaction,
  TransactionStatus
>;
