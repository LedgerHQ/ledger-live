// @flow

import { BigNumber } from "bignumber.js";
import { canUnbond, MAX_UNLOCKINGS } from "./logic";
import type { Account } from "../../types";

export default () => {
  describe("canUnbond", () => {
    test("can unbond", () => {
      const account: $Shape<Account> = {
        polkadotResources: {
          controller: "",
          stash: "",
          nonce: 0,
          numSlashingSpans: 0,
          lockedBalance: BigNumber(10000),
          unlockedBalance: BigNumber(0),
          unlockingBalance: BigNumber(0),
          nominations: [],
          unlockings: [
            ...Array(MAX_UNLOCKINGS - 1).map(() => ({
              amount: BigNumber(Math.random()),
              completionDate: new Date(),
            })),
          ],
        },
      };

      expect(canUnbond(account)).toBeTruthy();
    });
    test("can't unbond because unlockings is too much", () => {
      const account: $Shape<Account> = {
        polkadotResources: {
          controller: "",
          stash: "",
          nonce: 0,
          numSlashingSpans: 0,
          lockedBalance: BigNumber(1000000),
          unlockedBalance: BigNumber(0),
          unlockingBalance: BigNumber(0),
          nominations: [],
          unlockings: [
            ...Array(MAX_UNLOCKINGS).map(() => ({
              amount: BigNumber(Math.random()),
              completionDate: new Date(),
            })),
          ],
        },
      };

      expect(canUnbond(account)).toBeFalsy();
    });

    test("can't unbond because not enough lockedBalance", () => {
      const account: $Shape<Account> = {
        polkadotResources: {
          controller: "",
          stash: "",
          nonce: 0,
          numSlashingSpans: 0,
          lockedBalance: BigNumber(100),
          unlockedBalance: BigNumber(0),
          unlockingBalance: BigNumber(100),
          nominations: [],
          unlockings: [
            ...Array(MAX_UNLOCKINGS).map(() => ({
              amount: BigNumber(Math.random()),
              completionDate: new Date(),
            })),
          ],
        },
      };

      expect(canUnbond(account)).toBeFalsy();
    });
  });
};
