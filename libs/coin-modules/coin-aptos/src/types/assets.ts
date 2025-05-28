import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosTokenInfo = {
  tokenType: string;
  contractAddress: string;
};

export type AptosAsset = Asset<AptosTokenInfo>;

export type AptosExtra = Record<string, unknown>;

export type AptosSender = {
  xpub: string;
  freshAddress: string;
};

export type AptosFeeParameters = {
  gasLimit: bigint;
  gasPrice: bigint;
};
