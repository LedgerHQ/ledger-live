import { useFeature } from "@features/platform-feature-flags";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";

/**
 * Centralizes newSendFlow feature flag logic
 * FF format: { enabled: true, params: { families: ["bitcoin"], excludedCurrencyIds: ["zcash"] } }
 */
type NewSendFlowCurrencyFilter = {
  family?: string;
  currencyId?: string;
  allowedFamilies: readonly string[];
  excludedCurrencyIds: readonly string[];
};

export function isCurrencyAllowedForNewSendFlow({
  family,
  currencyId,
  allowedFamilies,
  excludedCurrencyIds,
}: NewSendFlowCurrencyFilter): boolean {
  if (currencyId && excludedCurrencyIds.includes(currencyId)) return false;
  if (!family) return true; // Opening flow without account - use new flow if feature flag is enabled
  return allowedFamilies.includes(family);
}

export function useNewSendFlowFeature() {
  const feature = useFeature("newSendFlow");

  const families = feature?.params?.families;
  const excludedCurrencies = feature?.params?.excludedCurrencyIds;
  const allowedFamilies = Array.isArray(families) ? families : [];
  const excludedCurrencyIds = Array.isArray(excludedCurrencies) ? excludedCurrencies : [];
  const isValidConfig = Boolean(feature?.enabled && allowedFamilies.length > 0);

  const isEnabledForFamily = (family?: string, currencyId?: string): boolean =>
    isValidConfig &&
    isCurrencyAllowedForNewSendFlow({
      family,
      currencyId,
      allowedFamilies,
      excludedCurrencyIds,
    });

  const getFamilyFromAccount = (
    account?: AccountLike,
    parentAccount?: Account | null,
  ): string | undefined => {
    return account ? getMainAccount(account, parentAccount ?? null).currency.family : undefined;
  };

  const getCurrencyIdFromAccount = (
    account?: AccountLike,
    parentAccount?: Account | null,
  ): string | undefined => {
    return account ? getMainAccount(account, parentAccount ?? null).currency.id : undefined;
  };

  return {
    feature,
    isEnabled: feature?.enabled ?? false,
    isEnabledForFamily,
    getFamilyFromAccount,
    getCurrencyIdFromAccount,
    allowedFamilies,
    excludedCurrencyIds,
  };
}
