import type { TFunction } from "i18next";
import type { AleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoUnbondingDisplayState } from "@ledgerhq/live-common/families/aleo/stakingDisplay";

export function getUnbondingStatusLabel(
  t: TFunction<"translation">,
  position: AleoStakingPosition,
  { isClaimable, isSettling, blocksLeft }: AleoUnbondingDisplayState,
): string {
  if (position.hasPendingUnbondingChange) {
    return position.hasPendingClaim
      ? t("aleo.stake.unstakingRow.claimPending")
      : t("aleo.stake.unstakingRow.unbondPending");
  }
  if (isClaimable) return t("aleo.stake.claimable");
  if (isSettling) return t("aleo.stake.unstakingRow.settling");
  return blocksLeft != null
    ? t("aleo.stake.unstakingRow.blocksRemaining", { count: blocksLeft })
    : "-";
}
