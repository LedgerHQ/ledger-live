import { MoveFunctionId } from "@aptos-labs/ts-sdk";
import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosToken = {
  type: string;
};

export type AptosAsset = Asset<AptosToken> & {
  function?: MoveFunctionId;
  version?: string;
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
