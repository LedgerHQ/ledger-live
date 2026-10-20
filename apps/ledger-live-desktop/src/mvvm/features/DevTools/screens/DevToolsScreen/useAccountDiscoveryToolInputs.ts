import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { deriveWithLegacySigners } from "@ledgerhq/live-common/account-data/discovery/deriveWithLegacySigners";
import type { AccountDiscoveryInputs } from "@devtools/bindings";
import { getCurrentDevice } from "~/renderer/reducers/devices";

export function useAccountDiscoveryToolInputs(): AccountDiscoveryInputs {
  const deviceId = useSelector(getCurrentDevice)?.deviceId;
  const currencies = useMemo(
    () => listSupportedCurrencies().map(({ id, name }) => ({ id, name })),
    [],
  );
  const derive = useMemo(
    () => (deviceId ? deriveWithLegacySigners(deviceId) : undefined),
    [deviceId],
  );
  return {
    currencies,
    derive,
    blockedReason: "No device selected: connect a device and open the currency app, then scan.",
  };
}
