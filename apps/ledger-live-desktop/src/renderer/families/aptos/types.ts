import { Operation } from "@ledgerhq/types-live";
import { FieldComponentProps, LLDCoinFamily } from "../types";
import { AptosAccount, TransactionStatus } from "@ledgerhq/coin-aptos/lib/types/index";

export type AptosFamily = LLDCoinFamily<AptosAccount, Transaction, TransactionStatus, Operation>;
export type AptosFieldComponentProps = FieldComponentProps<
  AptosAccount,
  Transaction,
  TransactionStatus
>;
