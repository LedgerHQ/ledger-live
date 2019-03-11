// @flow

import type { Account, CryptoCurrency, Operation, ExplorerView } from "./types";

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
