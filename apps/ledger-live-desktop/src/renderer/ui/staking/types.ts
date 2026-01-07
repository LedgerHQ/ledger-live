import {
  Account,
  Operation,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import { FieldComponentProps, LLDCoinFamily } from "~/renderer/families/types";

export type StakingFamily = LLDCoinFamily<
  Account,
  TransactionCommon,
  TransactionStatusCommon,
  Operation
>;
export type StakingFieldComponentProps = FieldComponentProps<
  Account,
  TransactionCommon,
  TransactionStatusCommon
>;
