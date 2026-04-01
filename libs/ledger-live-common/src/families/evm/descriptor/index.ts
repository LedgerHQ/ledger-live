import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { evmSendDescriptor } from "./send/descriptor";

export const descriptor: CoinDescriptor = {
  send: evmSendDescriptor,
  // Future: stake, swap, etc.
};
