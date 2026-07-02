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
