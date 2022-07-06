// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import type { ExchangeRaw } from "@ledgerhq/live-common/exchange/platform/types";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import { fromExchangeRaw } from "@ledgerhq/live-common/exchange/platform/serialization";
import type { TransactionRaw } from "@ledgerhq/live-common/types/index";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";

type Input = {
  deviceId: string,
  provider: string,
  binaryPayload: string,
  signature: string,
  exchange: ExchangeRaw,
  transaction: TransactionRaw,
  exchangeType: number,
};

const cmd = ({
  deviceId,
  provider,
  binaryPayload,
  signature,
  exchange,
  transaction,
  exchangeType,
}: Input): Observable<any> => {
  // TODO type the events?
  return from(
    completeExchange({
      deviceId,
      provider,
      binaryPayload,
      signature,
      exchange: fromExchangeRaw(exchange),
      transaction: fromTransactionRaw(transaction),
      exchangeType,
    }),
  );
};
export default cmd;
