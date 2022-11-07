import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import invariant from "invariant";
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
    const version = config.experimental.version;
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
