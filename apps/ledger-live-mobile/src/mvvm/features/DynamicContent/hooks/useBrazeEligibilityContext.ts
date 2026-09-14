import { DeviceModelId } from "@ledgerhq/types-devices";
import { useMemo } from "react";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import { accountsCountSelector, useAreAccountsEmpty } from "~/reducers/accounts";
import { hasCompletedOnboardingSelector, knownDeviceModelIdsSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";

export function useBrazeEligibilityContext(): EligibilityContext {
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const areAccountsEmpty = useAreAccountsEmpty();
  const isOnboarded = useSelector(hasCompletedOnboardingSelector);
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);

  return useMemo(
    () => ({
      hasFunds: hasAnyAccounts && !areAccountsEmpty,
      isOnboarded,
      hasStax: Boolean(knownDeviceModelIds[DeviceModelId.stax]),
    }),
    [areAccountsEmpty, hasAnyAccounts, isOnboarded, knownDeviceModelIds],
  );
}
