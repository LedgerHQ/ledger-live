import { BigNumber } from "bignumber.js";
import { DEFAULT_FEES_SAFETY_BUFFER } from "../constants";
import { polkadotMainnetConfigValue } from "../test/config.fixture";
import { PolkadotAccount, PolkadotResources } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import {
  calculateAmount,
  canUnbond,
  getFeesSafetyBuffer,
  isController,
  isFirstBond,
  isStash,
  MAX_UNLOCKINGS,
} from "./utils";

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

describe("getFeesSafetyBuffer", () => {
  it("falls back to the module default when the config has no fees section", () => {
    expect(getFeesSafetyBuffer(polkadotMainnetConfigValue)).toEqual(
      new BigNumber(DEFAULT_FEES_SAFETY_BUFFER),
    );
  });

  it("uses the configured safety buffer", () => {
    const config = { ...polkadotMainnetConfigValue, fees: { safetyBuffer: 42 } };

    expect(getFeesSafetyBuffer(config)).toEqual(new BigNumber(42));
  });
});

describe("calculateAmount", () => {
  const account = createFixtureAccount({ spendableBalance: new BigNumber(10_000_000_000) });
  const transaction = {
    ...createFixtureTransaction({ mode: "bond", fees: new BigNumber(1_000_000) }),
    useAllAmount: true,
  };

  it("keeps the default safety buffer when bonding all the amount", () => {
    const amount = calculateAmount({ config: polkadotMainnetConfigValue, account, transaction });

    expect(amount).toEqual(new BigNumber(10_000_000_000 - 1_000_000 - DEFAULT_FEES_SAFETY_BUFFER));
  });

  it("keeps the configured safety buffer when bonding all the amount", () => {
    const config = { ...polkadotMainnetConfigValue, fees: { safetyBuffer: 5_000_000_000 } };

    const amount = calculateAmount({ config, account, transaction });

    expect(amount).toEqual(new BigNumber(10_000_000_000 - 1_000_000 - 5_000_000_000));
  });
});
