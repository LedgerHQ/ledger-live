import type { ComponentType } from "react";
import perFamilyStakePositionSheet from "~/generated/StakePositionSheet";
import type { StakePositionSheetProps } from "../types";

const sheetsByFamily: Partial<Record<string, ComponentType<StakePositionSheetProps>>> =
  perFamilyStakePositionSheet;

/** The family's stake position sheet, when the family has one. */
export function stakePositionSheetOf(
  family: string,
): ComponentType<StakePositionSheetProps> | undefined {
  return Object.hasOwn(sheetsByFamily, family) ? sheetsByFamily[family] : undefined;
}
