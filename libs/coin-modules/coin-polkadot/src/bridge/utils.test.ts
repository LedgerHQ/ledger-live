import { BigNumber } from "bignumber.js";
import { PolkadotAccount, PolkadotResources } from "../types";
import { createFixtureAccount } from "../types/bridge.fixture";
import { canUnbond, isController, isFirstBond, isStash, MAX_UNLOCKINGS } from "./utils";

describe("isController", () => {
  const polkadotAccount: PolkadotAccount = createFixtureAccount();

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
    const account = createFixtureAccount({
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
    });
    expect(canUnbond(account)).toBe(true);
  });
  test("can't unbond because unlockings is too much", () => {
    const account = createFixtureAccount({
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
    });
    expect(canUnbond(account)).toBe(false);
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
    expect(canUnbond(account as PolkadotAccount)).toBe(false);
  });
});

describe("isStash", () => {
  it("returns false if account has no controller", () => {
    // When
    const result = isStash(createFixtureAccount());

    // Then
    expect(result).toBe(false);
  });

  it("returns true if account has controller", () => {
    // Given
    const account = createFixtureAccount({
      polkadotResources: { controller: "controller" } as PolkadotResources,
    });

    // When
    const result = isStash(account);

    // Then
    expect(result).toBe(true);
  });
});

describe("isFirstBond", () => {
  it("returns false if account a controller", () => {
    // Given
    const account = createFixtureAccount({
      polkadotResources: { controller: "controller" } as PolkadotResources,
    });

    // When
    const result = isFirstBond(account);

    // Then
    expect(result).toBe(false);
  });

  it("returns true if account has no controller", () => {
    // When
    const result = isFirstBond(createFixtureAccount());

    // Then
    expect(result).toBe(true);
  });
});
