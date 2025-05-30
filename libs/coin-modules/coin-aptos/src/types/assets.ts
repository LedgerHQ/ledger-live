import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosAsset = Asset<AptosToken>;

export type AptosToken = {
  tokenType: string;
  contractAddress: string;
};

export type AptosExtra = Record<string, unknown>;

export type AptosSender = {
  xpub: string;
  freshAddress: string;
};

export type AptosFeeParameters = {
  gasLimit: bigint;
  gasPrice: bigint;
};
