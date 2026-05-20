import type { ContactEntry } from "~/renderer/contacts/types";
import { getChainInfo } from "./getChainInfo";

export type ChainAddressGroup = {
  chainId: number;
  /** Short chain label, e.g. "Ethereum". Used as the section header. */
  shortLabel: string;
  entries: ContactEntry[];
};

/**
 * Group a contact's address entries by `chainId` so the details pane can
 * render one rounded section per network (matching the Figma frame
 * 13802:2833 layout: a small section label above a stack of address rows).
 *
 * Sort order:
 * - Groups: ascending `chainId` (Ethereum 1 first), to give stable output
 *   across renders without relying on the entries' insertion order.
 * - Within a group: insertion order is preserved.
 *
 * NOTE: The Figma comp labels the sections by TOKEN ("ETH" / "MANA" /
 * "USDC"). Our `ContactEntry` schema only carries `chainId`, not a per-
 * address token. Grouping by chain is the closest equivalent with the data
 * we have today; revisit when the contact data model gains explicit token
 * info (tracked as a Lumen-adoption + data-model follow-up).
 */
export function groupAddressesByChain(
  entries: ContactEntry[],
): ChainAddressGroup[] {
  const byChain = new Map<number, ContactEntry[]>();
  for (const e of entries) {
    const bucket = byChain.get(e.chainId);
    if (bucket) bucket.push(e);
    else byChain.set(e.chainId, [e]);
  }
  return Array.from(byChain.entries())
    .sort(([a], [b]) => a - b)
    .map(([chainId, bucket]) => ({
      chainId,
      shortLabel: getChainInfo(chainId).shortLabel,
      entries: bucket,
    }));
}
