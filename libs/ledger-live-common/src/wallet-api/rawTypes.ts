import type { SignedOperationRaw } from "@ledgerhq/types-live";

export type {
  RawAccount as RawWalletAPIAccount,
  RawTransaction as RawWalletAPITransaction,
} from "@ledgerhq/wallet-api-core";

export type RawWalletAPISignedTransaction = SignedOperationRaw;
