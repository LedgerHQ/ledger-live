import { Api, Asset, FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";

export type SuiAsset = Asset;

export type SuiFeeParameters = Record<string, bigint>;
export type SuiFeeEstimation = FeeEstimation<SuiFeeParameters>;

export type SuiSender = { address: string; xpub?: string };
export type SuiTransactionIntent = TransactionIntent<SuiAsset, Record<string, unknown>, SuiSender>;

export type SuiApi = Api<SuiAsset, Record<string, unknown>, SuiSender, SuiFeeParameters>;
