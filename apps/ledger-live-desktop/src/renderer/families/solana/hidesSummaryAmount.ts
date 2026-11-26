import type { Transaction } from "@ledgerhq/live-common/families/solana/types";

export const hidesSummaryAmount = (transaction: Transaction): boolean => !!transaction.raw;
