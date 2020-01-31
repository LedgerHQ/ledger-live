// @flow

import invariant from "invariant";
import type { CryptoCurrency } from "../types";
import { getEnv } from "../env";

type LedgerExplorer = {
  version: string,
  id: string,
  endpoint: string
};

export const findCurrencyExplorer = (
  currency: CryptoCurrency
): ?LedgerExplorer => {
  const exp = getEnv("EXPERIMENTAL_EXPLORERS");
  const idV2 = ledgerExplorersV2[currency.id];
  const idV3 = ledgerExplorersV3[currency.id];
  const explorer = getEnv("EXPLORER");
  if (idV3 && (exp || !idV2)) {
    return {
      endpoint: explorer,
      id: idV3,
      version: "v3"
    };
  }
  if (idV2) {
    return { endpoint: explorer, id: idV2, version: "v2" };
  }
};

export const hasCurrencyExplorer = (currency: CryptoCurrency): boolean =>
  !!findCurrencyExplorer(currency);

export const getCurrencyExplorer = (
  currency: CryptoCurrency
): LedgerExplorer => {
  const res = findCurrencyExplorer(currency);
  invariant(res, `no Ledger explorer for ${currency.id}`);
  return res;
};

const ledgerExplorersV2 = {
  bitcoin: "btc",
  bitcoin_cash: "abc",
  bitcoin_gold: "btg",
  clubcoin: "club",
  dash: "dash",
  decred: "dcr",
  digibyte: "dgb",
  dogecoin: "doge",
  // ethereum: "eth", // moved to v3!
  // ethereum_classic: "ethc", // libcore dropped support of this
  hcash: "hsr",
  komodo: "kmd",
  litecoin: "ltc",
  peercoin: "ppc",
  pivx: "pivx",
  poswallet: "posw",
  qtum: "qtum",
  stakenet: "xsn",
  stratis: "strat",
  stealthcoin: "xst",
  vertcoin: "vtc",
  viacoin: "via",
  zcash: "zec",
  zencash: "zen",
  bitcoin_testnet: "btc_testnet"
};

const ledgerExplorersV3 = {
  bitcoin: "btc",
  bitcoin_testnet: "btc_testnet",
  ethereum: "eth",
  ethereum_ropsten: "eth_ropsten",
  ethereum_classic: "etc"
  // tezos: "xtz"
};

export const blockchainBaseURL = (currency: CryptoCurrency): string => {
  const { id, version, endpoint } = getCurrencyExplorer(currency);
  return `${endpoint}/blockchain/${version}/${id}`;
};
