// @flow

import invariant from "invariant";
import type { CryptoCurrency, ExplorerView } from "./types";
import { getEnv } from "./env";

export const getDefaultExplorerView = (
  currency: CryptoCurrency
): ?ExplorerView => currency.explorerViews[0];

export const getTransactionExplorer = (
  explorerView: ?ExplorerView,
  txHash: string
): ?string =>
  explorerView && explorerView.tx && explorerView.tx.replace("$hash", txHash);

export const getAddressExplorer = (
  explorerView: ?ExplorerView,
  address: string
): ?string =>
  explorerView &&
  explorerView.address &&
  explorerView.address.replace("$address", address);

type LedgerExplorer = {
  version: string,
  id: string
};

export const findCurrencyExplorer = (
  currency: CryptoCurrency
): ?LedgerExplorer => {
  const exp = getEnv("EXPERIMENTAL_EXPLORERS");
  const idV2 = ledgerExplorersV2[currency.id];
  const idV3 = ledgerExplorersV3[currency.id];
  if (exp && idV3) {
    return { id: idV3, version: "v3" };
  }
  if (idV2) {
    return { id: idV2, version: "v2" };
  }
  if (idV3) {
    return { id: idV3, version: "v3" };
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
  ethereum: "eth",
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
  ethereum: "eth",
  ethereum_ropsten: "eth_ropsten",
  ethereum_classic: "eth-classic"
};
