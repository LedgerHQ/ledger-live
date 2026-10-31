import type { CryptoCurrency, ExplorerView } from "./schema";

export const getDefaultExplorerView = (
  currency: Pick<CryptoCurrency, "explorerViews">,
): ExplorerView | undefined => currency.explorerViews?.[0];

export const getTransactionExplorer = (
  explorerView: ExplorerView | undefined,
  txHash: string,
): string | undefined => explorerView?.tx?.replace("$hash", txHash);

export const getAddressExplorer = (
  explorerView: ExplorerView | undefined,
  address: string,
): string | undefined => explorerView?.address?.replace("$address", address);

export const getTokenExplorer = (
  explorerView: ExplorerView | undefined,
  contractAddress: string,
  ownerAddress: string,
): string | undefined =>
  explorerView?.token
    ?.replace("$contractAddress", contractAddress)
    .replace("$address", ownerAddress);

export const getStakePoolExplorer = (
  explorerView: ExplorerView | undefined,
  poolId: string,
): string | undefined => explorerView?.stakePool?.replace("$poolId", poolId);

export const getDRepExplorer = (
  explorerView: ExplorerView | undefined,
  hex: string,
): string | undefined => explorerView?.dRep?.replace("$hex", hex);
