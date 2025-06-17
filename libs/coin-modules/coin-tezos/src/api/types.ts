import { Api, Asset, FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";

export type TezosAsset = Asset;

export type TezosFeeParameters = { gasLimit: bigint; storageLimit: bigint };
export type TezosFeeEstimation = FeeEstimation<TezosFeeParameters>;

export type TezosSender = { address: string; xpub?: string };
export type TezosTransactionIntent = TransactionIntent<
  TezosAsset,
  Record<string, unknown>,
  TezosSender
>;

export type TezosApi = Api<TezosAsset, Record<string, unknown>, TezosSender, TezosFeeParameters>;
