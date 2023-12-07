import { RawTransaction } from "@ledgerhq/wallet-api-core";
import { Exchange } from "../../exchange/swap/types";
import { Transaction } from "../../generated/types";

export const methodIds = ["custom.exchange.start", "custom.exchange.complete"] as const;

export type MethodIds = (typeof methodIds)[number];

export type LoggerParams = {
  message: string;
};

export type LoggerResponse = void;

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
}

export type ExchangeStartParams = {
  exchangeType: "FUND" | "SELL" | "SWAP";
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

export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
  swapId?: string;
  rate?: number;
  amountExpectedTo?: number;
};

export type ExchangeUiHooks = {
  "custom.exchange.start": (params: {
    exchangeType: "FUND" | "SELL" | "SWAP";
    onSuccess: (nonce: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "custom.exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
};
