import {
  AlpacaApi,
  Asset,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";

export type TezosAsset = Asset;

export type TezosFeeParameters = { gasLimit: bigint; storageLimit: bigint };
export type TezosFeeEstimation = FeeEstimation;

export type TezosSender = { address: string; xpub?: string };
export type TezosTransactionIntent = TransactionIntent<TezosAsset>;

export type TezosApi = AlpacaApi<TezosAsset> & {
  estimateFees: (transactionIntent: TezosTransactionIntent) => Promise<TezosFeeEstimation>;
};
