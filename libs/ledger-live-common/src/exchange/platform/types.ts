import type { DeviceModelId } from "@ledgerhq/devices";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike, AccountRaw, AccountRawLike } from "@ledgerhq/types-live";
import type { ExchangeTypes, RateTypes } from "@ledgerhq/hw-app-exchange";
import type Transport from "@ledgerhq/hw-transport";
import type { Transaction } from "../../coin-modules/transaction-types";
import type { ExchangeSwap } from "../swap/types";
import type { Device } from "../../hw/actions/types";

export type CompleteExchangeRequestEvent =
  | { type: "complete-exchange" }
  | {
      type: "complete-exchange-requested";
      estimatedFees: string;
    }
  | {
      type: "complete-exchange-error";
      error: Error;
    }
  | {
      type: "complete-exchange-result";
      completeExchangeResult: Transaction;
    };

/** Hooks a confirmation sequence calls back into while it talks to the device. */
export type ConfirmExchangeCallbacks = {
  /** Polled between steps: once true, the sequence stops without sending further APDUs. */
  isCancelled: () => boolean;
  /** Called with the estimated fees right before the device asks the user to confirm. */
  onConfirmationRequested: (estimatedFees: string) => void;
};

/**
 * The Exchange app confirmation sequence, split so a host can open its own transport around
 * `run` and keep the error handling outside of it.
 */
export type ConfirmExchangeSequence = {
  run: (transport: Transport) => Promise<void>;
  /** Rethrows `run`'s failure as a user facing error, or returns for an expected end. */
  handleError: (error: unknown) => void;
  /** The fee-prepared transaction to sign, once `run` has resolved. */
  getTransaction: () => Transaction;
};

export type ExchangeSell = {
  fromParentAccount: Account | null | undefined;
  fromAccount: AccountLike;
  fromCurrency: CryptoOrTokenCurrency;
};

export type ExchangeSellRaw = {
  fromParentAccount: AccountRaw | null | undefined;
  fromAccount: AccountRawLike;
};

export type StartExchangeInput = {
  device: Device;
  exchangeType: number;
  appVersion?: string;
  provider?: string;
  fromAccountId?: string;
  toAccountId?: string;
};

interface CompleteExchangeInputCommon {
  rateType?: RateTypes;
  deviceModelId?: DeviceModelId;
  deviceId?: string;
  provider: string;
  binaryPayload: string;
  signature: string;
  transaction: Transaction;
  amountExpectedTo?: number;
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
