import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";

export const hasTokenStandardEnabled = (account: Account): boolean => {
  return getXrpEnabledTokenStandards(account.currency.id).length > 0;
};
