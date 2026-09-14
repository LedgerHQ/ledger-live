import { DeviceModelId } from "@ledgerhq/types-devices";
import { useMemo } from "react";
import { defaultIsAccountEmpty } from "@ledgerhq/live-common/bridge/defaultBridgeExtensions";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import { accountsSelector } from "~/reducers/accounts";
import { hasCompletedOnboardingSelector, knownDeviceModelIdsSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";

export function useBrazeEligibilityContext(): EligibilityContext {
  const accounts = useSelector(accountsSelector);
  const isOnboarded = useSelector(hasCompletedOnboardingSelector);
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);

  return useMemo(
    () => ({
      hasFunds: accounts.some(account => !defaultIsAccountEmpty(account)),
      isOnboarded,
      hasStax: Boolean(knownDeviceModelIds[DeviceModelId.stax]),
    }),
    [accounts, isOnboarded, knownDeviceModelIds],
  );
}
