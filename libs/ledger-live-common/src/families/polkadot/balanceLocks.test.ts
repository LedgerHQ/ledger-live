import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import type { PolkadotAccount } from "./types";
import polkadotBalanceLocks from "./balanceLocks";

const polkadot = (locked: number, unlocking: number, unlocked = 0): PolkadotAccount => ({
  ...genAccount("dot", { currency: getCryptoCurrencyById("polkadot") }),
  polkadotResources: {
    controller: null,
    stash: null,
    nonce: 0,
    lockedBalance: new BigNumber(locked),
    unlockingBalance: new BigNumber(unlocking),
    unlockedBalance: new BigNumber(unlocked),
    unlockings: [],
    nominations: [],
    numSlashingSpans: 0,
  },
});

describe("polkadotBalanceLocks", () => {
  it("splits the bonded balance into staked and unbonding, leaving out matured chunks", () => {
    expect(polkadotBalanceLocks(polkadot(100, 30, 10))).toEqual([
      { reason: "staked", amount: "70" },
      { reason: "unbonding", amount: "20" },
    ]);
  });

  it("answers no unbonding once every chunk has matured", () => {
    expect(polkadotBalanceLocks(polkadot(100, 30, 30))).toEqual([
      { reason: "staked", amount: "70" },
    ]);
  });

  it("answers no lock when nothing is bonded", () => {
    expect(polkadotBalanceLocks(polkadot(0, 0))).toEqual([]);
  });

  it("answers no lock for an account without Polkadot resources", () => {
    expect(
      polkadotBalanceLocks(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toEqual([]);
  });
});
