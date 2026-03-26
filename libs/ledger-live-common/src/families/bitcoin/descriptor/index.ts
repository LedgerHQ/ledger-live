import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { fees } from "./fees";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees,
    selfTransfer: "free",
  },
};
