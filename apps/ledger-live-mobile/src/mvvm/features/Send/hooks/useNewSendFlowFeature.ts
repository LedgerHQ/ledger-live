import { useFeature } from "@features/platform-feature-flags";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getNewSendFlowAllowedFamilies,
  getNewSendFlowExcludedCurrencyIds,
  isFamilyAllowedForNewSendFlow,
  isValidNewSendFlowConfig,
} from "../utils/newSendFlowConfig";

export function useNewSendFlowFeature() {
  const feature = useFeature("newSendFlow");

  const allowedFamilies = getNewSendFlowAllowedFamilies(feature);
  const excludedCurrencyIds = getNewSendFlowExcludedCurrencyIds(feature);
  const isValidConfig = isValidNewSendFlowConfig(feature);

  const isEnabledForFamily = (family?: string, currencyId?: string): boolean =>
    isValidConfig &&
    isFamilyAllowedForNewSendFlow(family, allowedFamilies, currencyId, excludedCurrencyIds);

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
