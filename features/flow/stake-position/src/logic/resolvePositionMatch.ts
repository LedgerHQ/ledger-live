import type { StakePositionCandidate, StakePositionMatch } from "../types";

/**
 * Whether the host can act on the position the live app asked for. The live app may show several
 * positions with one validator as one row: then no position is the one the user meant.
 */
export function resolvePositionMatch(
  candidates: ReadonlyArray<StakePositionCandidate>,
  target: StakePositionCandidate,
): StakePositionMatch {
  const withTargetValidator = candidates.filter(
    candidate => candidate.validatorAddress === target.validatorAddress,
  );
  if (withTargetValidator.length > 1) return { kind: "ambiguous" };

  const targetPosition = candidates.find(candidate => candidate.positionId === target.positionId);
  if (targetPosition?.validatorAddress !== target.validatorAddress) return { kind: "notFound" };

  return { kind: "match" };
}
