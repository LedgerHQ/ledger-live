import type { TonTransaction } from "../network/types";

// `total_fees` holds the action phase's share of the forwarding fees only: the rest travels in each
// message the account sends, and the account pays it all the same.
export const forwardFees = (tx: TonTransaction): bigint =>
  tx.out_msgs
    .filter(message => message.source === tx.account)
    .reduce(
      (sum, message) => sum + BigInt(message.fwd_fee ?? 0) + BigInt(message.ihr_fee ?? 0),
      0n,
    );
