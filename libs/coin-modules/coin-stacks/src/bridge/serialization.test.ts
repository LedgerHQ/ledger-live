import type { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { StacksAccount, StacksAccountRaw, StakingPosition } from "../types";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromStakingPositionRaw,
  toStakingPositionRaw,
} from "./serialization";

const position: StakingPosition = {
  uid: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  delegate: "SP000000000000000000002Q6VF78.signer-pool",
  state: "active",
  actions: ["undelegate"],
  asset: { type: "native" },
  amount: new BigNumber("123456789012345678901"),
  details: {
    firstRewardCycle: 100,
    numCycles: 6,
    rewardAsset: "sbtc",
    amountRewarded: "42",
  },
};

/** Mirrors what persistence does between the two hooks: a JSON round trip of the raw account. */
const roundTrip = (account: StacksAccount): StacksAccount => {
  const raw = {} as AccountRaw;
  assignToAccountRaw(account as Account, raw);
  const restored = {} as StacksAccount;
  assignFromAccountRaw(JSON.parse(JSON.stringify(raw)), restored);
  return restored;
};

describe("stacks serialization", () => {
  it("round-trips stakingPositions, reviving BigNumber amounts and keeping actions/details", () => {
    const restored = roundTrip({ stakingPositions: [position] } as StacksAccount);

    expect(restored.stakingPositions).toEqual([position]);
    expect(BigNumber.isBigNumber(restored.stakingPositions?.[0].amount)).toBe(true);
  });

  it("round-trips optional amounts and dates when present", () => {
    const full: StakingPosition = {
      ...position,
      amountDeposited: new BigNumber("100"),
      amountRewarded: new BigNumber("23"),
      createdAt: new Date("2026-01-02T03:04:05.000Z"),
      stateUpdatedAt: new Date("2026-02-03T04:05:06.000Z"),
    };

    const raw = toStakingPositionRaw(full);
    expect(raw).toMatchObject({
      amount: "123456789012345678901",
      amountDeposited: "100",
      amountRewarded: "23",
      createdAt: "2026-01-02T03:04:05.000Z",
      stateUpdatedAt: "2026-02-03T04:05:06.000Z",
    });
    expect(fromStakingPositionRaw(raw)).toEqual(full);
  });

  it("persists an empty array as a known 'no stake'", () => {
    expect(
      roundTrip({ stakingPositions: [] } as unknown as StacksAccount).stakingPositions,
    ).toEqual([]);
  });

  it("leaves stakingPositions absent when it was never known", () => {
    const raw = {} as StacksAccountRaw;
    assignToAccountRaw({} as Account, raw);
    expect(raw).not.toHaveProperty("stakingPositions");

    const account = {} as StacksAccount;
    assignFromAccountRaw({} as AccountRaw, account);
    expect(account).not.toHaveProperty("stakingPositions");
  });
});
