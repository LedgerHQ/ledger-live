import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";

type LedgerExplorer = {
  version: string;
  id: string;
  endpoint: string;
};

export const findCurrencyExplorer = (
  currency: CryptoCurrency
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

export const getCurrencyExplorer = (
  currency: CryptoCurrency
): LedgerExplorer => {
  const res = findCurrencyExplorer(currency);
  invariant(res, `no Ledger explorer for ${currency.id}`);
  return <LedgerExplorer>res;
};

export const blockchainBaseURL = (currency: CryptoCurrency): string => {
  const { id, version, endpoint } = getCurrencyExplorer(currency);
  return `${endpoint}/blockchain/${version}/${id}`;
};
