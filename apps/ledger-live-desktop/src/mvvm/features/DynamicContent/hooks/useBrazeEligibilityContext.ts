import { DeviceModelId } from "@ledgerhq/types-devices";
import { useMemo } from "react";
import { defaultIsAccountEmpty } from "@ledgerhq/live-common/bridge/defaultBridgeExtensions";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import { createSelector } from "reselect";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  devicesModelListSelector,
  hasCompletedOnboardingSelector,
} from "~/renderer/reducers/settings";

const hasFundsSelector = createSelector(accountsSelector, accounts =>
  accounts.some(account => !defaultIsAccountEmpty(account)),
);

const hasStaxSelector = createSelector(devicesModelListSelector, devicesModelList =>
  devicesModelList.includes(DeviceModelId.stax),
);

export function useBrazeEligibilityContext(): EligibilityContext {
  const hasFunds = useSelector(hasFundsSelector);
  const isOnboarded = useSelector(hasCompletedOnboardingSelector);
  const hasStax = useSelector(hasStaxSelector);

  return useMemo(
    () => ({
      hasFunds,
      isOnboarded,
      hasStax,
    }),
    [hasFunds, isOnboarded, hasStax],
  );
}
