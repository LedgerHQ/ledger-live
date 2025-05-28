import {
  AlpacaApi,
  Asset,
  FeeEstimation,
  TransactionIntent,
  MemoNotSupported,
} from "@ledgerhq/coin-framework/api/types";

export type TezosAsset = Asset;

export type TezosFeeParameters = { gasLimit: bigint; storageLimit: bigint };
export type TezosFeeEstimation = FeeEstimation;

export type TezosSender = { address: string; xpub?: string };
// No memo support
export type TezosTransactionIntent = TransactionIntent<TezosAsset, MemoNotSupported>;

// NOTE: extending here WIP
export type TezosApi = AlpacaApi<TezosAsset, MemoNotSupported> & {
  estimateFees: (
    transactionIntent: TezosTransactionIntent,
    // TezosSender can be used if needed later
  ) => Promise<TezosFeeEstimation>;
};
