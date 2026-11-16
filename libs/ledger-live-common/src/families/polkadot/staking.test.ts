import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import type { PolkadotAccount, PolkadotResources } from "./types";
import polkadotStaking from "./staking";

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

describe("polkadotStaking", () => {
  it("maps the bond to one position nominating its validators, active while one is elected", () => {
    const account = polkadot({
      lockedBalance: new BigNumber(100),
      unlockingBalance: new BigNumber(30),
      nominations: [
        { address: "val1", value: new BigNumber(60), status: "active" },
        { address: "val2", value: new BigNumber(0), status: "waiting" },
      ],
    });
    expect(polkadotStaking(account).positions).toEqual([
      {
        id: "bonded",
        assetId: "polkadot",
        validatorIds: ["val1", "val2"],
        state: "active",
        amount: "70",
      },
    ]);
  });

  it("keeps the bond inactive while no nominated validator is elected, without validators when none", () => {
    const waiting = polkadot({
      lockedBalance: new BigNumber(50),
      nominations: [{ address: "val1", value: new BigNumber(0), status: "waiting" }],
    });
    expect(polkadotStaking(waiting).positions).toEqual([
      {
        id: "bonded",
        assetId: "polkadot",
        validatorIds: ["val1"],
        state: "inactive",
        amount: "50",
      },
    ]);
    const [bonded] = polkadotStaking(
      polkadot({ lockedBalance: new BigNumber(50), nominations: null }),
    ).positions;
    expect(bonded.validatorIds).toBeUndefined();
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
    expect(polkadotStaking(account).positions).toEqual([
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
    expect(polkadotStaking(polkadot({ nominations: null, unlockings: null }))).toEqual({
      positions: [],
    });
  });

  it("answers no position for an account without Polkadot resources", () => {
    expect(
      polkadotStaking(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toEqual({ positions: [] });
  });
});
