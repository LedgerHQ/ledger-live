import { Api, Asset, FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";

export type TezosAsset = Asset;

export type TezosFeeParameters = { gasLimit: bigint; storageLimit: bigint };
export type TezosFeeEstimation = FeeEstimation;

export type TezosSender = { address: string; xpub?: string };
export type TezosTransactionIntentExtra = { gasLimit?: number; storageLimit?: number };
export type TezosTransactionIntent = TransactionIntent<
  TezosAsset,
  TezosTransactionIntentExtra,
  TezosSender
>;

export type TezosApi = Api<
  TezosAsset,
  TezosTransactionIntentExtra,
  TezosSender,
  TezosFeeParameters
> & {
  estimateFees: (transactionIntent: TezosTransactionIntent) => Promise<TezosFeeEstimation>;
};
