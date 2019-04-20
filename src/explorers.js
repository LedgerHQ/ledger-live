// @flow

import invariant from "invariant";
import type { Account, CryptoCurrency, Operation, ExplorerView } from "./types";
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

// NB deprecated & should be replaced by using directly the other functions
export const getAccountOperationExplorer = (
  account: Account,
  operation: Operation
): ?string =>
  getTransactionExplorer(
    getDefaultExplorerView(account.currency),
    operation.hash
  );

type LedgerExplorer = {
  version: string,
  id: string
};

export const findCurrencyExplorer = (
  currency: CryptoCurrency
): ?LedgerExplorer => {
  const exp = getEnv("EXPERIMENTAL_EXPLORERS");
  const version = exp ? "v3" : "v2";
  const id = (exp ? ledgerExplorersV3 : ledgerExplorersV2)[currency.id];
  return id ? { id, version } : null;
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

const ledgerExplorersV3 = {
  bitcoin: "btc",
  bitcoin_cash: "abc",
  bitcoin_gold: "btg",
  clubcoin: "club",
  dash: "dash",
  decred: "dcr",
  digibyte: "dgb",
  dogecoin: "doge",
  ethereum: "eth-mainnet",
  ethereum_classic: "ethc",
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
  bitcoin_testnet: "btc_testnet",
  ethereum_ropsten: "eth-ropsten"
};

// overrides the id used
const ledgerExplorersV2overrides = {
  ethereum: "eth",
  ethereum_ropsten: null
};

const ledgerExplorersV2 = {
  ...ledgerExplorersV3,
  ...ledgerExplorersV2overrides
};
