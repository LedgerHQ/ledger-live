import {
  CosmosAccount,
  CosmosOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type CosmosFamily = LLDCoinFamily<
  CosmosAccount,
  Transaction,
  TransactionStatus,
  CosmosOperation
>;
export type CosmosFieldComponentProps = FieldComponentProps<
  CosmosAccount,
  Transaction,
  TransactionStatus
>;
