import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Exchange } from "@ledgerhq/live-common/exchange/platform/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type ResultStart = {
  startExchangeResult?: string;
  startExchangeError?: Error;
  device?: Device;
};

export type ResultComplete = {
  operation?: Operation;
  error?: Error;
};

export type PlatformExchangeNavigatorParamList = {
  [ScreenName.PlatformStartExchange]: {
    request: { exchangeType: number };
    onResult: (_: ResultStart) => void;
  };
  [ScreenName.PlatformCompleteExchange]: {
    request: {
      exchangeType: number;
      provider: string;
      exchange: Exchange;
      transaction: Transaction;
      binaryPayload: string;
      signature: string;
      feesStrategy: string;
      rateType?: number;
      amountExpectedTo?: number;
    };
    device?: Device;
    onResult: (_: ResultComplete) => void;
  };
};
