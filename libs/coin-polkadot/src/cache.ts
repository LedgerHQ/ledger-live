import type { PolkadotAccount, Transaction } from "./types";

/**
 * Create a hash for a transaction that is params-specific and stay unchanged if no influcing fees
 *
 * @param {*} a
 * @param {*} t
 *
 * @returns {string} hash
 */
export const hashTransactionParams = (
  a: PolkadotAccount,
  t: Transaction,
  signedTx: string
) => {
  // Nonce is added to discard previous estimation when account is synced.
  const prefix = `${a.id}_${a.polkadotResources?.nonce || 0}_${t.mode}`;
  // Fees depends on extrinsic bytesize
  const byteSize = signedTx.length;

  // And on extrinsic weight (which varies with the method called)
  switch (t.mode) {
    case "send":
      return `${prefix}_${byteSize}`;

    case "bond":
      return t.rewardDestination
        ? `${prefix}_${byteSize}_${t.rewardDestination}`
        : `${prefix}_${byteSize}`;

    case "unbond":
    case "rebond":
      return `${prefix}_${byteSize}`;

    case "nominate":
      return `${prefix}_${t.validators?.length ?? "0"}`;

    case "withdrawUnbonded":
      return `${prefix}_${t.numSlashingSpans ?? "0"}`;

    case "chill":
      return `${prefix}`;
    case "setController":
      return `${prefix}`;
    case "claimReward":
      return `${prefix}_${t.era || "0"}`;

    default:
      throw new Error("Unknown mode in transaction");
  }
};
