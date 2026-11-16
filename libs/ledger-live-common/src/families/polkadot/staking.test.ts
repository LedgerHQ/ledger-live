import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import type { PolkadotAccount, PolkadotResources } from "./types";
import polkadotStakingPositions from "./staking";

const past = new Date("2020-01-01T00:00:00.000Z");
const future = new Date("2999-01-01T00:00:00.000Z");

const polkadot = (resources: Partial<PolkadotResources> = {}): PolkadotAccount => ({
  ...genAccount("dot", { currency: getCryptoCurrencyById("polkadot") }),
  polkadotResources: {
    controller: null,
    stash: null,
    nonce: 0,
    lockedBalance: new BigNumber(0),
    unlockingBalance: new BigNumber(0),
    unlockedBalance: new BigNumber(0),
    unlockings: [],
    nominations: [],
    numSlashingSpans: 0,
    ...resources,
  },
});

describe("polkadotStakingPositions", () => {
  it("maps nominations to positions on their validator, the bond backing none as inactive", () => {
    const account = polkadot({
      lockedBalance: new BigNumber(100),
      unlockingBalance: new BigNumber(30),
      nominations: [
        { address: "val1", value: new BigNumber(60), status: "active" },
        { address: "val2", value: new BigNumber(0), status: "waiting" },
      ],
    });
    expect(polkadotStakingPositions(account)).toEqual([
      {
        id: "nomination:val1",
        assetId: "polkadot",
        validatorId: "val1",
        state: "active",
        amount: "60",
      },
      {
        id: "nomination:val2",
        assetId: "polkadot",
        validatorId: "val2",
        state: "inactive",
        amount: "0",
      },
      { id: "bonded", assetId: "polkadot", state: "inactive", amount: "10" },
    ]);
  });

  it("maps unlocking chunks to unlocking positions, withdrawable once unlocked", () => {
    const account = polkadot({
      lockedBalance: new BigNumber(30),
      unlockingBalance: new BigNumber(30),
      unlockings: [
        { amount: new BigNumber(10), completionDate: future },
        { amount: new BigNumber(20), completionDate: past },
      ],
    });
    expect(polkadotStakingPositions(account)).toEqual([
      {
        id: `unlocking:${future.getTime()}:0`,
        assetId: "polkadot",
        state: "deactivating",
        amount: "10",
        unlockAt: future.toISOString(),
      },
      {
        id: `unlocking:${past.getTime()}:1`,
        assetId: "polkadot",
        state: "withdrawable",
        amount: "20",
        unlockAt: past.toISOString(),
      },
    ]);
  });

  it("answers no position when nothing is bonded", () => {
    expect(polkadotStakingPositions(polkadot({ nominations: null, unlockings: null }))).toEqual([]);
  });

  it("answers no position for an account without Polkadot resources", () => {
    expect(
      polkadotStakingPositions(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toEqual([]);
  });
});
