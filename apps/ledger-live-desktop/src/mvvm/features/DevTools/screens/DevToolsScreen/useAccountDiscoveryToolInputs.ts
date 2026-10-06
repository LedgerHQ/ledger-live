import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { deriveOnDevice } from "@ledgerhq/live-common/account-data/discoveryPorts";
import type { AccountDiscoveryInputs } from "@devtools/bindings";
import { coinModuleFamilies } from "~/config/account-data-setup";
import { getCurrentDevice } from "~/renderer/reducers/devices";

/**
 * Discovery asks `exists` to the account data sources, and only the coin module source can say it
 * for an account the app does not hold yet: the currencies are those of its families.
 */
export function useAccountDiscoveryToolInputs(): AccountDiscoveryInputs {
  const device = useSelector(getCurrentDevice);
  const deviceId = device?.deviceId;

  const currencies = useMemo(() => {
    const families = new Set(coinModuleFamilies.balance());
    return listSupportedCurrencies()
      .filter(currency => families.has(currency.family))
      .map(({ id, name }) => ({ id, name }));
  }, []);

  const derive = useMemo(() => (deviceId ? deriveOnDevice(deviceId) : undefined), [deviceId]);

  return {
    currencies,
    derive,
    blockedReason: "No device selected: connect a device and open the currency app, then scan.",
  };
}
