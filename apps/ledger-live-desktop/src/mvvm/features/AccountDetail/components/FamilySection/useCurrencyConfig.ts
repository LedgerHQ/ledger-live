import { useEffect, useState } from "react";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { subscribeToRemoteFlags } from "~/firebase/remoteConfig";

type CurrencyConfigSnapshot = Readonly<{
  currencyId: string;
  currencyConfig: CurrencyConfig | undefined;
}>;

const readCurrencyConfig = (currencyId: string): CurrencyConfigSnapshot => {
  try {
    return { currencyId, currencyConfig: getCurrencyConfiguration(currencyId) };
  } catch {
    return { currencyId, currencyConfig: undefined };
  }
};

export const useCurrencyConfig = (currencyId: string): CurrencyConfig | undefined => {
  const [snapshot, setSnapshot] = useState(() => {
    return readCurrencyConfig(currencyId);
  });

  if (snapshot.currencyId !== currencyId) {
    setSnapshot(readCurrencyConfig(currencyId));
  }

  useEffect(() => {
    return subscribeToRemoteFlags(() => {
      setSnapshot(readCurrencyConfig(currencyId));
    });
  }, [currencyId]);

  return snapshot.currencyConfig;
};
