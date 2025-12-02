import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";

/**
 * Centralizes newSendFlow feature flag logic
 * FF format: { enabled: true, params: { families: ["bitcoin", "solana"] } }
 */
export function useNewSendFlowFeature() {
  const feature = useFeature("newSendFlow");

  const allowedFamilies = feature?.params?.families ?? [];
  const isValidConfig =
    feature?.enabled && Array.isArray(allowedFamilies) && allowedFamilies.length > 0;

  const isEnabledForFamily = (family?: string): boolean => {
    if (!isValidConfig) return false;
    if (!family) return true; // Opening flow without account
    return allowedFamilies.includes(family);
  };

  const getFamilyFromAccount = (
    account?: AccountLike,
    parentAccount?: Account | null,
  ): string | undefined => {
    return account ? getMainAccount(account, parentAccount ?? null).currency.family : undefined;
  };

  return {
    feature,
    isEnabled: feature?.enabled ?? false,
    isEnabledForFamily,
    getFamilyFromAccount,
    allowedFamilies,
  };
}
