import { Observable } from "rxjs";

import { ExchangeTypes } from "@ledgerhq/hw-app-exchange";

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
    case ExchangeTypes.Swap:
      if (!input.exchange.toAccount) {
        throw new Error("'toAccount' requested for Swap exchange");
      }

      return completeExchangeSwap(input);

    case ExchangeTypes.Sell:
      return completeExchangeTransfer(input);

    case ExchangeTypes.Fund:
      return completeExchangeTransfer(input);

    default:
      throw new Error("exchangeType not handled");
  }
};

export default completeExchange;
