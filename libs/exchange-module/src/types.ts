import { RawTransaction } from "@ledgerhq/wallet-api-core";

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
}

export type ExchangeStartParams = {
  exchangeType: "FUND" | "SELL" | "SWAP";
};

export type ExchangeStartSellParams = ExchangeStartParams & {
  exchangeType: "SELL";
  provider: string;
};

export type ExchangeStartSwapParams = ExchangeStartParams & {
  exchangeType: "SWAP";
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  tokenCurrency?: string;
};

export type ExchangeStartResult = {
  transactionId: string;
};

export type ExchangeCompleteBaseParams = {
  provider: string;
  fromAccountId: string;
  rawTransaction: RawTransaction;
  hexBinaryPayload: string;
  hexSignature: string;
  feeStrategy: "SLOW" | "MEDIUM" | "FAST" | "CUSTOM";
  tokenCurrency?: string;
};

export type ExchangeCompleteFundParams = ExchangeCompleteBaseParams & {
  exchangeType: "FUND";
};

export type ExchangeCompleteSellParams = ExchangeCompleteBaseParams & {
  exchangeType: "SELL";
};

export type ExchangeCompleteSwapParams = ExchangeCompleteBaseParams & {
  exchangeType: "SWAP";
  toAccountId: string;
  swapId: string;
  rate: number;
};

export type ExchangeCompleteParams =
  | ExchangeCompleteFundParams
  | ExchangeCompleteSellParams
  | ExchangeCompleteSwapParams;

export type ExchangeCompleteResult = {
  transactionHash: string;
};
