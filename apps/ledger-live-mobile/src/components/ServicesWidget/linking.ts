import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CompanionStepKey } from "../../screens/SyncOnboarding/types";

function appendParamsToURL(
  url: string,
  params: Record<string, string | number | boolean>,
) {
  const paramsStr = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");
  return `${url}?${paramsStr}`;
}

function getDummyAppParams(device?: Device) {
  return {
    pairStaxURL: appendParamsToURL("ledgerlive://sync-onboarding", {
      filterByDeviceModelId: DeviceModelId.stax,
      areKnownDevicesDisplayed: true,
      onSuccessAddToKnownDevices: false,
    }),
    completeSyncOnboardingURL: appendParamsToURL(
      "ledgerlive://completeSyncOnboarding", // TODO: not implemented
      {},
    ),
    ...(device
      ? {
          resumeSyncOnboardingURL: appendParamsToURL(
            "ledgerlive://sync-onboarding-companion",
            {
              deviceJsonURIComponent: JSON.stringify(device),
              initialStepKey: CompanionStepKey.Seed,
            },
          ),
        }
      : {}),
  };
}

export function getDummyAppURL(device?: Device) {
  const url = appendParamsToURL(
    "ledgerlive://discover/dummy-wallet-app",
    getDummyAppParams(device),
  );
  return url;
}
