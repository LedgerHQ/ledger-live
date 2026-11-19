import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";

const getMemoValue = (transaction: Transaction): string | undefined =>
  transaction.memoValue ?? undefined;

export default getMemoValue;
