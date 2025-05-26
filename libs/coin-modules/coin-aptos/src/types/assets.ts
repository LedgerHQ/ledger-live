import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosAsset = Asset;

export type AptosExtra = Record<string, unknown>;

export type AptosFeeParameters = {
  gasLimit: bigint;
  gasPrice: bigint;
};
