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

/**
 * `validatorLabel` carries the committee's name for the validator and nothing else, so it is empty
 * both for a validator the list does not name and for one that is not in the list at all. The
 * address is what the account itself holds and what the device shows, so it reads better in the
 * name slot than a generic "Aleo" — which is kept only for a position with no validator to name.
 */
export function getValidatorLabel(
  t: TFunction<"translation">,
  { validatorLabel, bondedValidator }: AleoStakingPositionView,
): string {
  return validatorLabel || bondedValidator || t("aleo.stake.fallbackValidator");
}

export function getStakedStatusLabel(
  t: TFunction<"translation">,
  position: AleoStakingPositionView,
): string {
  if (position.validatorsError) return t("aleo.stake.status.unknown");
  if (position.nonEarningReason) return t(`aleo.stake.nonEarning.${position.nonEarningReason}`);
  return t("aleo.stake.status.earning");
}
