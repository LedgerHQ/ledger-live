import { setup } from "../../__tests__/test-helpers/libcore-setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import dataset from "./test-dataset";
import { disconnect } from "./api";
import { BigNumber } from "bignumber.js";
import { canUnbond, MAX_UNLOCKINGS } from "./logic";
import type { Account } from "../../types";

// Disconnect all api clients that could be open.
afterAll(async () => {
  await disconnect();
});

setup("polkadot");
testBridge("polkadot", dataset);

describe("canUnbond", () => {
  test("can unbond", () => {
    const account: Partial<Account> = {
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(10000),
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(0),
        nominations: [],
        unlockings: [
          ...Array(MAX_UNLOCKINGS - 1).map(() => ({
            amount: new BigNumber(Math.random()),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as Account)).toBeTruthy();
  });
  test("can't unbond because unlockings is too much", () => {
    const account: Partial<Account> = {
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(1000000),
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(0),
        nominations: [],
        unlockings: [
          ...Array(MAX_UNLOCKINGS).map(() => ({
            amount: new BigNumber(Math.random()),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as Account)).toBeFalsy();
  });
  test("can't unbond because not enough lockedBalance", () => {
    const account: Partial<Account> = {
      polkadotResources: {
        controller: "",
        stash: "",
        nonce: 0,
        numSlashingSpans: 0,
        lockedBalance: new BigNumber(100),
        unlockedBalance: new BigNumber(0),
        unlockingBalance: new BigNumber(100),
        nominations: [],
        unlockings: [
          ...Array(MAX_UNLOCKINGS).map(() => ({
            amount: new BigNumber(Math.random()),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as Account)).toBeFalsy();
  });
});
