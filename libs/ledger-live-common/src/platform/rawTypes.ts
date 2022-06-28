import type { SignedOperationRaw } from "@ledgerhq/types-live";

export type {
  RawAccount as RawPlatformAccount,
  RawTransaction as RawPlatformTransaction,
} from "@ledgerhq/live-app-sdk";

export type RawPlatformSignedTransaction = SignedOperationRaw;
