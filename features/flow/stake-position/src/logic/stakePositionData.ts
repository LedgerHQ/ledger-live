import type { EarnPosition, EarnPositions } from "@domain/entity-earn-position";
import type { StakePositionData } from "../types";
import { toDisplayedState } from "./positionRules";
import { UNKNOWN_STATUS_READS_AS } from "./productRules";

type PositionRow =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "one"; position: EarnPosition }>
  | Readonly<{ kind: "duplicate" }>;

/** The row of the position. One stake account is one row, so a repeated id is not a position. */
export function findStakePositionRow(positions: EarnPositions, positionId: string): PositionRow {
  const [row, ...repeated] = positions.positions.filter(({ id }) => id === positionId);
  if (row === undefined) return { kind: "none" };
  return repeated.length > 0 ? { kind: "duplicate" } : { kind: "one", position: row };
}

export type StakePositionDataInput = Readonly<{
  /** The latest positions of the address, kept while a newer read runs or after it fails. */
  positions: EarnPositions | undefined;
  /** The latest read failed. */
  isError: boolean;
  positionId: string;
  isPolling: boolean;
  retry: () => void;
}>;

/**
 * What the details can show of the position. A provider failure is an error, never "no position":
 * the row may exist behind it, as it may behind a failed read of older positions. A closed
 * (`archived`) row is not found.
 */
export function resolveStakePositionData({
  positions,
  isError,
  positionId,
  isPolling,
  retry,
}: StakePositionDataInput): StakePositionData {
  const error: StakePositionData = { kind: "error", retry };
  if (positions === undefined) return isError ? error : { kind: "loading" };

  const row = findStakePositionRow(positions, positionId);
  if (row.kind === "duplicate") return error;
  if (row.kind === "none") {
    return positions.failures.length > 0 || isError ? error : { kind: "notFound" };
  }

  const { position } = row;
  const status = toDisplayedState(position.status);
  if (status === null) {
    const isUnknownError = position.status === "unknown" && UNKNOWN_STATUS_READS_AS === "error";
    return isUnknownError ? error : { kind: "notFound" };
  }
  return { kind: "ready", position, status, isStale: positions.isStale, isPolling };
}
