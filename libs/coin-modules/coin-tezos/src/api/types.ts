import type { Api, FeeEstimation } from "@ledgerhq/coin-framework/api/types";

export type TezosFeeParameters = {
  gasLimit: bigint;
  storageLimit: bigint;
  amount?: bigint;
  txFee?: bigint;
};
export type TezosFeeEstimation = FeeEstimation & {
  parameters?: TezosFeeParameters & Record<string, unknown>;
};

export type TezosSender = { address: string; xpub?: string };

export type TezosApi = Api;
