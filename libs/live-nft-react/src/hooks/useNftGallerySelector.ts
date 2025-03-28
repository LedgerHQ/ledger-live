import { Account } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";

type HookProps = {
  accounts: Account[];
  supportedCurrencies: string[];
  config: {
    featureFlagEnabled?: boolean;
  };
};

export function useNftGallerySelector({ accounts, supportedCurrencies, config }: HookProps) {
  const isCurrencySupported = useCallback(
    (currencyId: string, supportedCurrencies: string[], featureFlagEnabled?: boolean) =>
      supportedCurrencies.includes(currencyId) && (currencyId !== "solana" || !!featureFlagEnabled),
    [],
  );
  const { addresses, chains } = useMemo(() => {
    const addressSet = new Set<string>();
    const chainSet = new Set<string>();

    for (const account of accounts) {
      if (
        isCurrencySupported(account.currency.id, supportedCurrencies, config.featureFlagEnabled)
      ) {
        addressSet.add(account.freshAddress);
        chainSet.add(account.currency.id);
      }
    }

    return {
      addresses: Array.from(addressSet).join(","),
      chains: Array.from(chainSet),
    };
  }, [accounts, config.featureFlagEnabled, isCurrencySupported, supportedCurrencies]);

  return {
    addresses,
    chains,
  };
}
