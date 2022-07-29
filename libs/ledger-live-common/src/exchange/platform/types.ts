import type {
  Account,
  AccountLike,
  AccountRaw,
  AccountRawLike,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../generated/types";
import { ExchangeTypes, RateTypes } from "../hw-app-exchange/Exchange";

export type CompleteExchangeRequestEvent =
  | { type: "complete-exchange" }
  | {
      type: "complete-exchange-requested";
      estimatedFees: BigNumber;
    }
  | {
      type: "complete-exchange-error";
      error: Error;
    }
  | {
      type: "complete-exchange-result";
      completeExchangeResult: Transaction;
    };

export type ExchangeSwap = {
  fromParentAccount: Account | null | undefined;
  fromAccount: AccountLike;
  toParentAccount: Account | null | undefined;
  toAccount: AccountLike;
};

export type ExchangeSwapRaw = {
  fromParentAccount: AccountRaw | null | undefined;
  fromAccount: AccountRawLike;
  toParentAccount: AccountRaw | null | undefined;
  toAccount: AccountRawLike;
};

export type ExchangeSell = {
  fromParentAccount: Account | null | undefined;
  fromAccount: AccountLike;
};

export type ExchangeSellRaw = {
  fromParentAccount: AccountRaw | null | undefined;
  fromAccount: AccountRawLike;
};

interface CompleteExchangeInputCommon {
  rateType: RateTypes;
  deviceId?: string;
  provider: string;
  binaryPayload: string;
  signature: string;
  transaction: Transaction;
}
export interface CompleteExchangeInputSell extends CompleteExchangeInputCommon {
  readonly exchangeType: ExchangeTypes.Sell;
  exchange: ExchangeSell;
}

export interface CompleteExchangeInputFund extends CompleteExchangeInputCommon {
  readonly exchangeType: ExchangeTypes.Fund;
  exchange: ExchangeSell;
}

export interface CompleteExchangeInputSwap extends CompleteExchangeInputCommon {
  readonly exchangeType: ExchangeTypes.Swap;
  exchange: ExchangeSwap;
}

export type Exchange = ExchangeSwap | ExchangeSell;

export type ExchangeRaw = ExchangeSwapRaw | ExchangeSellRaw;
