import { AlpacaApi, FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";

export type TezosFeeParameters = { gasLimit: bigint; storageLimit: bigint };
export type TezosFeeEstimation = FeeEstimation;

export type TezosSender = { address: string; xpub?: string };
export type TezosTransactionIntent = TransactionIntent;

export type TezosApi = AlpacaApi & {
  estimateFees: (transactionIntent: TezosTransactionIntent) => Promise<TezosFeeEstimation>;
};
