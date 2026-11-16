import { Observable } from "rxjs";

import { EXCHANGE_TYPE } from "../intents/exchangeTypes";

import type {
  CompleteExchangeInputFund,
  CompleteExchangeInputSell,
  CompleteExchangeInputSwap,
  CompleteExchangeRequestEvent,
} from "./types";

import completeExchangeSwap from "../swap/completeExchange";
import completeExchangeTransfer from "./transfer/completeExchange";

type CompleteExchangeInput =
  | CompleteExchangeInputSell
  | CompleteExchangeInputSwap
  | CompleteExchangeInputFund;

const completeExchange = (
  input: CompleteExchangeInput,
): Observable<CompleteExchangeRequestEvent> => {
  switch (input.exchangeType) {
    case EXCHANGE_TYPE.swap:
      if (!input.exchange.toAccount) {
        throw new Error("'toAccount' requested for Swap exchange");
      }

      return completeExchangeSwap(input);

    case EXCHANGE_TYPE.sell:
    case EXCHANGE_TYPE.fund:
      return completeExchangeTransfer(input);

    default:
      throw new Error("exchangeType not handled");
  }
};

export default completeExchange;
