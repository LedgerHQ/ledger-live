import { DeviceModelId } from "@ledgerhq/types-devices";
import { useMemo } from "react";
import { defaultIsAccountEmpty } from "@ledgerhq/live-common/bridge/defaultBridgeExtensions";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import { accountsSelector } from "~/reducers/accounts";
import { hasCompletedOnboardingSelector, knownDeviceModelIdsSelector } from "~/reducers/settings";
import { createSelector } from "~/context/selectors";
import { useSelector } from "~/context/hooks";

const hasFundsSelector = createSelector(accountsSelector, accounts =>
  accounts.some(account => !defaultIsAccountEmpty(account)),
);

const hasStaxSelector = createSelector(knownDeviceModelIdsSelector, knownDeviceModelIds =>
  Boolean(knownDeviceModelIds[DeviceModelId.stax]),
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
