import { RawTransaction } from "@ledgerhq/wallet-api-core";

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
  SWAP_NG = 0x03,
  SELL_NG = 0x04,
  FUND_NG = 0x05,
}

export type ExchangeStartParams = {
  exchangeType: "FUND" | "SELL" | "SWAP" | "FUND_NG" | "SELL_NG" | "SWAP_NG";
};

export type ExchangeStartSwapParams = ExchangeStartParams & {
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  tokenCurrency: string;
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
