import { ABIEvent, Hex, VIP180_ABI } from "@vechain/sdk-core";
import type { BlockEventLog } from "../types";

/** `keccak256("Transfer(address,address,uint256)")` — topic 0 of every VIP-180 transfer log. */
export const VIP180_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export interface Vip180Transfer {
  from: string;
  to: string;
  value: bigint;
}

/**
 * Whether a log is a VIP-180 `Transfer` emitted by `tokenAddress`. `decodeVip180Transfer` throws on
 * anything else, so any caller reading unfiltered logs — a block output carries every event the
 * clause emitted — must narrow with this first.
 */
export function isVip180Transfer(event: BlockEventLog, tokenAddress: string): boolean {
  return (
    event.address.toLowerCase() === tokenAddress.toLowerCase() &&
    event.topics[0]?.toLowerCase() === VIP180_TRANSFER_TOPIC
  );
}

/**
 * Decodes a VIP-180 `Transfer` log. The SDK returns checksummed addresses; they are lowercased so
 * that a decoded transfer is comparable with the addresses Thor reports elsewhere (VET transfers,
 * `origin`, `gasPayer`), which are lowercase.
 */
export function decodeVip180Transfer(event: BlockEventLog): Vip180Transfer {
  const { args } = ABIEvent.parseLog(VIP180_ABI, {
    data: Hex.of(event.data),
    topics: event.topics.map(topic => Hex.of(topic)),
  }) as { eventName: "Transfer"; args: { from: string; to: string; value: bigint } };

  return {
    from: args.from.toLowerCase(),
    to: args.to.toLowerCase(),
    value: args.value,
  };
}
