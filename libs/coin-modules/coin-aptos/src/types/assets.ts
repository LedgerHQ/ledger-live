import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosAsset = Asset<AptosTokenInformation>;

export type AptosTokenInformation = {
  standard: string;
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
