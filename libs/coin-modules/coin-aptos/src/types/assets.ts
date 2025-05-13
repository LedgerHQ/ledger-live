import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosAsset = Asset;

export type AptosExtra = unknown;

export type AptosSender = {
  xpub: string;
  freshAddress: string;
  // spendableBalance: BigNumber;
};

export type FeeParameters = {
  gasLimit: bigint;
  gasPrice: bigint;
};
