import {
  AptosAccount,
  TransactionStatus,
  AptosOperation,
} from "@ledgerhq/coin-aptos/lib/types/index";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type AptosFamily = LLDCoinFamily<
  AptosAccount,
  Transaction,
  TransactionStatus,
  AptosOperation
>;
export type AptosFieldComponentProps = FieldComponentProps<
  AptosAccount,
  Transaction,
  TransactionStatus
>;
