import type { TFunction } from "i18next";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { getRemoveBlocker } from "@ledgerhq/live-common/families/xrp/tokens";
import type { XrpTokenAccount, XrpTokenResources } from "@ledgerhq/live-common/families/xrp/types";

const REMOVE_BLOCKER_KEYS = {
  pending: "xrp.removeToken.pending",
  frozen: "xrp.removeToken.frozen",
} as const;

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};

export const getXrpResources = (
  account: AccountLike | undefined,
): XrpTokenResources | undefined => {
  if (account?.type !== "TokenAccount") return undefined;

  return (account as XrpTokenAccount).xrpResources;
};

export function getRemoveAvailability(account: TokenAccount, parentAccount: Account, t: TFunction) {
  const blocker = getRemoveBlocker(parentAccount, account);
  if (blocker) {
    return { disabled: true, tooltip: t(REMOVE_BLOCKER_KEYS[blocker]) };
  }

  return { disabled: !getXrpResources(account) };
}
