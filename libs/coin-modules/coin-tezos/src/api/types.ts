import type { AlpacaApi, FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

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

export type TezosApi = AlpacaApi & BridgeApi;
