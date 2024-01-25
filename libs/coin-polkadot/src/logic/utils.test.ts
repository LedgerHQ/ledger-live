import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { PolkadotAccount } from "../types";
import { canUnbond, isController, MAX_UNLOCKINGS } from "./utils";

const polkadotAccount: PolkadotAccount = {
  type: "Account",
  id: "",
  seedIdentifier: "",
  derivationMode: "",
  freshAddress: "",
  freshAddressPath: "",
  name: "",
  starred: false,
  index: 0,
  freshAddresses: [],
  spendableBalance: new BigNumber(0),
  balance: new BigNumber(0),
  used: true,
  creationDate: new Date(),
  blockHeight: 0,
  currency: getCryptoCurrencyById("polkadot"),
  unit: { name: "DOT", code: "DOT", magnitude: 16 },
  operations: [],
  pendingOperations: [],
  operationsCount: 0,
  lastSyncDate: new Date(),
  balanceHistoryCache: {} as any,
  swapHistory: [],
  polkadotResources: {} as any,
};

describe("isController", () => {
  it("returns false when stash is not defined", () => {
    const accountIsController = isController(polkadotAccount);
    expect(accountIsController).toBe(false);
  });

  it("returns false when stash account is undefined or null", () => {
    polkadotAccount.polkadotResources.stash = null;
    const accountIsController = isController(polkadotAccount);
    expect(accountIsController).toBe(false);
  });

  it("returns true when stash account is defined", () => {
    polkadotAccount.polkadotResources.stash = "stashAddress";
    const accountIsController = isController(polkadotAccount);
    expect(accountIsController).toBe(true);
  });
});

describe("canUnbond", () => {
  test("can unbond", () => {
    const account: Partial<PolkadotAccount> = {
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
            amount: new BigNumber(100000),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as PolkadotAccount)).toBeTruthy();
  });
  test("can't unbond because unlockings is too much", () => {
    const account: Partial<PolkadotAccount> = {
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
            amount: new BigNumber(100000),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as PolkadotAccount)).toBeFalsy();
  });
  test("can't unbond because not enough lockedBalance", () => {
    const account: Partial<PolkadotAccount> = {
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
            amount: new BigNumber(100000),
            completionDate: new Date(),
          })),
        ],
      },
    };
    expect(canUnbond(account as PolkadotAccount)).toBeFalsy();
  });
});
