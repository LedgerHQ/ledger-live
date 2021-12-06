import invariant from "invariant";
import type { CryptoCurrency } from "../types";
import { getEnv } from "../env";
import { getExplorerConfig } from "./explorerConfig";

type LedgerExplorer = {
  version: string;
  id: string;
  endpoint: string;
};

export const findCurrencyExplorer = (
  currency: CryptoCurrency
): LedgerExplorer | null | undefined => {
  const config = getExplorerConfig()[currency.id];
  if (!config) return;
  const { id } = config;

  if (getEnv("SATSTACK") && currency.id === "bitcoin") {
    return {
      endpoint: getEnv("EXPLORER_SATSTACK"),
      id: "btc",
      version: "v3",
    };
  }

  if (config.experimental && getEnv("EXPERIMENTAL_EXPLORERS")) {
    const base = config.experimental.base;
    let version = config.experimental.version;
    const CURRENCIES_JS = getEnv("EXPERIMENTAL_CURRENCIES_JS_BRIDGE");
    let useJS = false;
    if (CURRENCIES_JS) {
      useJS = CURRENCIES_JS.split(",").includes(currency.id);
    }
    //V2 explorer for doge and bitcoin cash when libcore is used
    if ((currency.id === "bitcoin_cash" || currency.id === "doge") && !useJS) {
      version = "v2";
    }
    return {
      endpoint: getEnv(base),
      id,
      version,
    };
  }

  const { base, version } = config.stable;
  return {
    endpoint: getEnv(base),
    id,
    version,
  };
};

export const hasCurrencyExplorer = (currency: CryptoCurrency): boolean =>
  !!findCurrencyExplorer(currency);

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
