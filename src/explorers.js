// @flow

import type { CryptoCurrency, ExplorerView } from "./types";

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
