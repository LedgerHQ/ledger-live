import { BigNumber } from "bignumber.js";
import { IconAccount } from "./types";
import { Account } from "@ledgerhq/types-live";

export function initAccount(account: Account): void {
  (account as IconAccount).iconResources = {
    nonce: 0,
    votingPower: BigNumber(0),
    totalDelegated: BigNumber(0),
  };
}
