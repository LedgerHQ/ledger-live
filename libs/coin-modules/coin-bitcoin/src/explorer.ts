import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
import { getEnv } from "@ledgerhq/live-env";

type LedgerExplorer = {
  version: string;
  id: string;
  endpoint: string;
};

const findCurrencyExplorer = (currency: CryptoCurrency): LedgerExplorer | null | undefined => {
  if (!currency.explorerId) {
    console.warn("no explorerId for", currency.id);
  }

  if (currency.id === "bitcoin_regtest") {
    return {
      endpoint: getEnv("EXPLORER_REGTEST"),
      id: "btc_regtest",
      version: "v4",
    };
  }
  return {
    endpoint: getEnv("EXPLORER"),
    id: currency.explorerId ?? currency.id,
    version: "v4",
  };
};

export const getCurrencyExplorer = (currency: CryptoCurrency): LedgerExplorer => {
  const res = findCurrencyExplorer(currency);
  invariant(res, `no Ledger explorer for ${currency.id}`);
  return res;
};

export const blockchainBaseURL = (currency: CryptoCurrency): string => {
  const { id, version, endpoint } = getCurrencyExplorer(currency);
  return `${endpoint}/blockchain/${version}/${id}`;
};
