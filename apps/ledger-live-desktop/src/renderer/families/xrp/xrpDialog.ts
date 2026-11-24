import type { AccountId } from "@domain/entity-account";
import { openFamilyDialog } from "LLD/features/FamilyDialogs/familyDialogs";

type XrpDialogParams = { screen: "manageAssets" };

export const openXrpDialog = (accountId: AccountId, params: XrpDialogParams) =>
  openFamilyDialog(accountId, params);

export function isXrpDialogParams(params: unknown): params is XrpDialogParams {
  return typeof params === "object" && params !== null && "screen" in params;
}
