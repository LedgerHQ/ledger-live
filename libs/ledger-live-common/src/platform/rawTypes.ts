import type { SignedOperationRaw } from "../types";

export type {
  RawAccount as RawPlatformAccount,
  RawTransaction as RawPlatformTransaction,
} from "@ledgerhq/live-app-sdk";

export type RawPlatformSignedTransaction = SignedOperationRaw;
