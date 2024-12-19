import { RawTransaction } from "@ledgerhq/wallet-api-core";

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
}

export type ExchangeStartParams =
  | ExchangeStartFundParams
  | ExchangeStartSellParams
  | ExchangeStartSwapParams;

export type ExchangeStartFundParams = {
  exchangeType: "FUND";
};

export type ExchangeStartSellParams = {
  exchangeType: "SELL";
  provider: string;
  fromAccountId: string;
};

export type ExchangeStartSwapParams = {
  exchangeType: "SWAP";
  provider: string;
  fromAccountId: string;
  toAccountId: string;
  tokenCurrency?: string;
};

export type ExchangeStartResult = {
  transactionId: string;
  device?: { deviceId?: string; modelId?: string };
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
};

export type ExchangeCompleteParams =
  | ExchangeCompleteFundParams
  | ExchangeCompleteSellParams
  | ExchangeCompleteSwapParams;

export type ExchangeCompleteResult = {
  transactionHash: string;
};

export type SwapLiveError = {
  type?: string;
  cause: {
    message?: string;
    swapCode?: string;
    response?: {
      data?: {
        error?: { messageKey?: string; message?: string };
      };
    };
  };
};
