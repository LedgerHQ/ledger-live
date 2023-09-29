import {
  AptosAccount,
  Transaction,
  TransactionStatus,
} from "../../../../../../libs/ledger-live-common/src/families/aptos/types.ts"; // TODO: use correct path after hw-app-aptos release
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type AptosFamily = LLDCoinFamily<AptosAccount, Transaction, TransactionStatus>;
export type AptosFieldComponentProps = FieldComponentProps<
  AptosAccount,
  Transaction,
  TransactionStatus
>;
