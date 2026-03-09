import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { IconAccount } from "./types";

export function initAccount(account: Account): void {
  (account as IconAccount).iconResources = {
    nonce: 0,
    votingPower: BigNumber(0),
    totalDelegated: BigNumber(0),
  };
}
