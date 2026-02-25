import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";

type LedgerExplorer = {
  version: string;
  id: string;
  endpoint: string;
};

export const findCurrencyExplorer = (
  currency: CryptoCurrency,
): LedgerExplorer | null | undefined => {
  if (currency.explorerId == null) {
    console.warn("no explorerId for", currency.id);
  }

  return {
    endpoint: getEnv("EXPLORER"),
    id: currency.explorerId ?? currency.id,
    version: "v4",
  };
};
