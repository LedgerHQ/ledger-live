import type { MaxSpendableFilters } from "@ledgerhq/types-live";

/** The filters a Wallet API caller asked for, or `undefined` when it asked for none. */
export function toMaxSpendableFilters({
  pools,
  private: isPrivate,
}: MaxSpendableFilters): MaxSpendableFilters | undefined {
  if (pools === undefined && isPrivate === undefined) return undefined;
  return {
    ...(pools !== undefined && { pools }),
    ...(isPrivate !== undefined && { private: isPrivate }),
  };
}
