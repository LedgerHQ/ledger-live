import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { celoFeeCurrencyField } from "./extraFields";
import { fees } from "./fees";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees,
    amount: {
      extraFields: [celoFeeCurrencyField],
    },
  },
};
