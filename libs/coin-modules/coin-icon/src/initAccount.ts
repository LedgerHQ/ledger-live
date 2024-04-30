import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { IconAccount } from "./types";

export function initAccount(r: Account): void {
  (r as IconAccount).iconResources = {
    nonce: 0,
    votingPower: BigNumber(0),
    totalDelegated: BigNumber(0),
  };
}
