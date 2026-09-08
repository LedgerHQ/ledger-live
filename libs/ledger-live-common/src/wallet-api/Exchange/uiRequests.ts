import { ExchangeStartResult, SwapLiveError } from "@ledgerhq/wallet-api-exchange-module";
import { BigNumber } from "bignumber.js";
import { ExchangeSwap } from "../../exchange/swap/types";
import { Exchange } from "../../exchange/types";
import { Transaction } from "../../coin-modules/transaction-types";

export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
  swapId?: string;
  amountExpectedTo?: number;
  magnitudeAwareRate?: BigNumber;
  refundAddress?: string;
  payoutAddress?: string;
  sponsored?: boolean;
  isEmbeddedSwap?: boolean;
  swapEntryPoint?: string;
};

type FundStartParamsUiRequest = {
  exchangeType: "FUND";
  provider: string;
  exchange: Partial<Exchange> | undefined;
};

type SellStartParamsUiRequest = {
  exchangeType: "SELL";
  provider: string;
  exchange: Partial<Exchange> | undefined;
};

export type SwapStartParamsUiRequest = {
  exchangeType: "SWAP";
  provider: string;
  exchange: Partial<ExchangeSwap>;
};

export type ExchangeStartParamsUiRequest =
  | FundStartParamsUiRequest
  | SellStartParamsUiRequest
  | SwapStartParamsUiRequest;

export type SwapUiRequest = CompleteExchangeUiRequest & {
  provider?: string;
  fromAccountId?: string;
  toAccountId?: string;
  tokenCurrency?: string;
  correlationId?: string;
};

export type ExchangeUiHooks = {
  "custom.exchange.start": (params: {
    exchangeParams: ExchangeStartParamsUiRequest;
    onSuccess: (nonce: string, device?: ExchangeStartResult["device"]) => void;
    onCancel: (error: Error, device?: ExchangeStartResult["device"]) => void;
  }) => void;
  "custom.exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "custom.exchange.error": (params: {
    error: SwapLiveError | undefined;
    onSuccess: () => void;
    onCancel: () => void;
  }) => void;
  "custom.isReady": (params: { onSuccess: () => void; onCancel: () => void }) => void;
  "custom.exchange.swap": (params: {
    exchangeParams: SwapUiRequest;
    onSuccess: ({ operationHash, swapId }: { operationHash: string; swapId: string }) => void;
    onCancel: (error: Error) => void;
  }) => void;
};
