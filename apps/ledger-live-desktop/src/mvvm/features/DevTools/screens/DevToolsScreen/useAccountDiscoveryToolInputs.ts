import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { deriveWithLegacySigners } from "~/config/account-data-setup";
import type { AccountDiscoveryInputs } from "@devtools/bindings";
import { getCurrentDevice } from "~/renderer/reducers/devices";

export function useAccountDiscoveryToolInputs(): AccountDiscoveryInputs {
  const deviceId = useSelector(getCurrentDevice)?.deviceId;
  const currencies = useMemo(
    () => listSupportedCurrencies().map(({ id, name }) => ({ id, name })),
    [],
  );
  const derive = useMemo(
    // Speculos and the mock device have an empty id: only a missing device blocks the scan.
    () => (deviceId === undefined ? undefined : deriveWithLegacySigners(deviceId)),
    [deviceId],
  );
  return {
    currencies,
    derive,
    blockedReason: "No device selected: connect a device and open the currency app, then scan.",
  };
}
