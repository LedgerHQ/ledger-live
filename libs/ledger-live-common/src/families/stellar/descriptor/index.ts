import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { errors } from "./errors";
import { fees } from "./fees";
import { memo } from "./memo";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees,
    errors,
  },
};
