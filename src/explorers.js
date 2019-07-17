// @flow

import type {
  CryptoCurrency,
  ExplorerView,
  TokenAccount,
  Account
} from "./types";

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

export const getAccountContractExplorer = (
  explorerView: ?ExplorerView,
  account: TokenAccount,
  parentAccount: Account
): ?string =>
  explorerView &&
  explorerView.token &&
  explorerView.token
    .replace("$contractAddress", account.token.contractAddress)
    .replace("$address", parentAccount.freshAddress);
