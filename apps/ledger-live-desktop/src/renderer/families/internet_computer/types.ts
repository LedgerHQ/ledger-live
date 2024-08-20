import {
  Transaction,
  TransactionStatus,
  ICPAccount,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { LLDCoinFamily } from "../types";
import { Operation } from "@ledgerhq/types-live";

export type InternetComputerFamily = LLDCoinFamily<
  ICPAccount,
  Transaction,
  TransactionStatus,
  Operation
>;
