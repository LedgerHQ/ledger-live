import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getNewSendFlowAllowedFamilies,
  isFamilyAllowedForNewSendFlow,
  isValidNewSendFlowConfig,
} from "../utils/newSendFlowConfig";

export function useNewSendFlowFeature() {
  const feature = useFeature("newSendFlow");

  const allowedFamilies = getNewSendFlowAllowedFamilies(feature);
  const isValidConfig = isValidNewSendFlowConfig(feature);

  const isEnabledForFamily = (family?: string): boolean =>
    isFamilyAllowedForNewSendFlow(family, allowedFamilies, isValidConfig);

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
