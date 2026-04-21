import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { evmSendDescriptor } from "./send/descriptor";
import { STAKING_CONTRACTS } from "@ledgerhq/coin-evm/staking/contracts";

export const descriptor: CoinDescriptor = {
  send: evmSendDescriptor,
  stake: {
    supportedModes: ["delegate", "undelegate", "redelegate"],
    currencyIds: Object.keys(STAKING_CONTRACTS),
  },
};
