import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useState } from "react";

export const useModularDrawer = () => {
  const [preselectedCurrencies, setPreselectedCurrencies] = useState<CryptoOrTokenCurrency[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(
    (currencies?: CryptoOrTokenCurrency[]) => {
      if (currencies) {
        setPreselectedCurrencies(currencies);
      }
      setIsDrawerOpen(true);
    },
    [setPreselectedCurrencies, setIsDrawerOpen],
  );

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    preselectedCurrencies,
    setPreselectedCurrencies,
  };
};
