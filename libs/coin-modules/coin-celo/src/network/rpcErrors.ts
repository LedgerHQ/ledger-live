/**
 * Heuristic for an EVM execution revert vs a transient/transport failure.
 *
 * A revert means the node executed and rejected the call (e.g. a prerequisite is
 * not yet on-chain, or a vote exceeds a group's cap) — safe to treat as a
 * definitive "no". A transient failure (timeout, dropped connection, rate limit,
 * RPC down) must surface instead of being mistaken for a definitive result.
 *
 * Shared by `estimateFees` (revert → fixed-gas fallback) and `getVoteNeighbors`
 * (revert/empty-eligible-set → zero neighbors).
 */
export const isRevertLike = (error: unknown): boolean => {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (/timeout|timed out|econn|socket|network|fetch failed|request failed/.test(message)) {
    return false;
  }
  return (
    message.includes("revert") ||
    message.includes("execution error") ||
    message.includes("out of gas") ||
    message.includes("invalid opcode")
  );
};

/**
 * Stable substring of the revert reason emitted by Celo's
 * `Blockable.onlyWhenNotBlocked` modifier while the `EpochManager` is processing
 * an epoch. The full reason is "Contract is blocked from performing this action";
 * matching the "contract is blocked" prefix tolerates provider-side truncation.
 * `Election.vote` (and other blockable staking mutations) revert with it while
 * that window is open.
 */
export const EPOCH_BLOCK_REVERT = "contract is blocked";

/**
 * True when an error is the transient "epoch processing" block (see
 * {@link EPOCH_BLOCK_REVERT}) rather than a generic revert. Lets the bridge map
 * it to a dedicated, user-friendly error instead of an opaque RPC failure.
 */
export const isEpochBlockRevert = (error: unknown): boolean => {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes(EPOCH_BLOCK_REVERT);
};
