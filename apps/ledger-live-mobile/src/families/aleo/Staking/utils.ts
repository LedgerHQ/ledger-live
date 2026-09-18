import type { TFunction } from "i18next";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoUnbondingDisplayState } from "@ledgerhq/live-common/families/aleo/types";

export function getUnbondingStatusLabel(
  t: TFunction<"translation">,
  position: AleoStakingPositionView,
  { isClaimable, isSettling, blocksLeft }: AleoUnbondingDisplayState,
): string {
  if (position.pendingKind === "claim") return t("aleo.stake.unstakingRow.claimPending");
  if (position.pendingKind === "unbond") return t("aleo.stake.unstakingRow.unbondPending");
  if (isClaimable) return t("aleo.stake.claimable");
  if (isSettling) return t("aleo.stake.unstakingRow.settling");
  return blocksLeft !== null
    ? t("aleo.stake.unstakingRow.blocksRemaining", { count: blocksLeft })
    : "-";
}

export function getStakedStatusLabel(
  t: TFunction<"translation">,
  position: AleoStakingPositionView,
): string {
  if (position.validatorsError) return t("aleo.stake.status.unknown");
  if (position.nonEarningReason) return t(`aleo.stake.nonEarning.${position.nonEarningReason}`);
  return t("aleo.stake.status.earning");
}
