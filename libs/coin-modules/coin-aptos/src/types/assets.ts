import { MoveFunctionId } from "@aptos-labs/ts-sdk";
import type { Asset } from "@ledgerhq/coin-framework/api/types";

export type AptosAsset = Asset & {
  function: MoveFunctionId;
};

export type AptosExtra = unknown;

export type AptosSender = {
  xpub: string;
  freshAddress: string;
};

export type AptosFeeParameters = {
  gasLimit: bigint;
  gasPrice: bigint;
};
