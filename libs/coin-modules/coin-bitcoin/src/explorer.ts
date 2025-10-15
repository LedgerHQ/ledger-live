import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
import { getEnv } from "@ledgerhq/live-env";

type LedgerExplorer = {
  version: string;
  id: string;
  endpoint: string;
};

const findCurrencyExplorer = (currency: CryptoCurrency): LedgerExplorer | null | undefined => {
  if (getEnv("SATSTACK") && currency.id === "bitcoin") {
    return {
      endpoint: getEnv("EXPLORER_SATSTACK"),
      id: "btc",
      version: "v3",
    };
  }

  if (currency.id === "bitcoin_testnet" && process.env.COIN_TESTER_ENV) {
    return {
      endpoint: getEnv("EXPLORER_COIN_TESTER"),
      id: "btc_regtest",
      version: "v4",
    };
  }

  if (!currency.explorerId) {
    console.warn("no explorerId for", currency.id);
  }

  return {
    endpoint: getEnv("EXPLORER"),
    id: currency.explorerId ?? currency.id,
    version: "v4",
  };
};

export const getCurrencyExplorer = (currency: CryptoCurrency): LedgerExplorer => {
  // NOTE: Only for CoinTester Bitcoin
  const res = findCurrencyExplorer(currency);
  invariant(res, `no Ledger explorer for ${currency.id}`);
  return res;
};

export const blockchainBaseURL = (currency: CryptoCurrency): string => {
  const { id, version, endpoint } = getCurrencyExplorer(currency);
  return `${endpoint}/blockchain/${version}/${id}`;
};
