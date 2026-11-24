import { useEffect, useState } from "react";
import { findCryptoCurrencyById, type CryptoCurrencyId } from "@domain/entity-currency-crypto";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import {
  buildDeviceInitializationInput,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";

export function useAccountDiscoveryExecutorViewModel(
  currencyId: CryptoCurrencyId,
  onError: (error: unknown) => void,
) {
  const [initializationInput, setInitializationInput] = useState<InitializationInput | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currency = findCryptoCurrencyById(currencyId);
    if (!currency) {
      onError(new Error(`Unknown currency ${currencyId}`));
      return;
    }
    // The add-account flow and the currency name let the executor show the app's deprecation screens.
    buildDeviceInitializationInput({
      appRequest: { appName: currency.managerAppName },
      flow: FlowName.addAccount,
      currencyName: currency.name,
    }).then(
      input => {
        if (!cancelled) setInitializationInput(input);
      },
      error => {
        if (!cancelled) onError(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [currencyId, onError]);

  return initializationInput;
}
