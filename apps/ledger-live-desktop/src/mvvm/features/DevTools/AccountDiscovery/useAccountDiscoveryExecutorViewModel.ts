import { useEffect, useMemo, useState } from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
  type InitializerConfig,
} from "LLD/components/DeviceIntentExecutor";

/** Builds the executor's initialization on the currency's app, and reports a failure to start as an error. */
export function useAccountDiscoveryExecutorViewModel(
  currencyId: string,
  onError: (error: unknown) => void,
) {
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);
  const initializerConfig = useMemo<InitializerConfig>(
    () => ({ onInitializationFailed: onError }),
    [onError],
  );

  useEffect(() => {
    let cancelled = false;
    const currency = getCryptoCurrencyById(currencyId);
    // The add-account flow and the currency name let the executor show the app's deprecation screens.
    buildDeviceInitializationInput({
      appRequest: { appName: currency.managerAppName },
      flow: FlowName.addAccount,
      currencyName: currency.name,
    }).then(input => {
      if (!cancelled) setInitializationInput(input);
    }, onError);
    return () => {
      cancelled = true;
    };
  }, [currencyId, onError]);

  return { initializationInput, initializerConfig };
}
