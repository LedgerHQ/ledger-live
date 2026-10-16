import { BigNumber } from "bignumber.js";
import type { TronResources, TronResourcesRaw } from "./model";
import { fromTronResourcesRaw, toTronResourcesRaw } from "./serialization";

const full: TronResources = {
  frozen: {
    bandwidth: { amount: new BigNumber(1_000_000) },
    energy: { amount: new BigNumber(2_000_000) },
  },
  unFrozen: {
    bandwidth: [
      { amount: new BigNumber(3_000_000), expireTime: new Date("2026-01-03T00:00:00.000Z") },
    ],
    energy: [
      { amount: new BigNumber(4_000_000), expireTime: new Date("2026-01-04T00:00:00.000Z") },
    ],
  },
  delegatedFrozen: {
    bandwidth: { amount: new BigNumber(5_000_000) },
    energy: { amount: new BigNumber(6_000_000) },
  },
  legacyFrozen: {
    bandwidth: {
      amount: new BigNumber(7_000_000),
      expiredAt: new Date("2026-01-07T00:00:00.000Z"),
    },
    energy: { amount: new BigNumber(8_000_000), expiredAt: new Date("2026-01-08T00:00:00.000Z") },
  },
  votes: [{ name: "Ledger", address: "TLedger", voteCount: 9 }],
  tronPower: 10,
  energy: new BigNumber(11),
  bandwidth: {
    freeUsed: new BigNumber(12),
    freeLimit: new BigNumber(13),
    gainedUsed: new BigNumber(14),
    gainedLimit: new BigNumber(15),
  },
  unwithdrawnReward: new BigNumber(16),
  lastWithdrawnRewardDate: new Date("2026-01-17T00:00:00.000Z"),
  lastVotedDate: new Date("2026-01-18T00:00:00.000Z"),
};

const fullRaw: TronResourcesRaw = {
  frozen: { bandwidth: { amount: "1000000" }, energy: { amount: "2000000" } },
  unFrozen: {
    bandwidth: [{ amount: "3000000", expireTime: "2026-01-03T00:00:00.000Z" }],
    energy: [{ amount: "4000000", expireTime: "2026-01-04T00:00:00.000Z" }],
  },
  delegatedFrozen: { bandwidth: { amount: "5000000" }, energy: { amount: "6000000" } },
  legacyFrozen: {
    bandwidth: { amount: "7000000", expiredAt: "2026-01-07T00:00:00.000Z" },
    energy: { amount: "8000000", expiredAt: "2026-01-08T00:00:00.000Z" },
  },
  votes: [{ name: "Ledger", address: "TLedger", voteCount: 9 }],
  tronPower: 10,
  energy: "11",
  bandwidth: { freeUsed: "12", freeLimit: "13", gainedUsed: "14", gainedLimit: "15" },
  unwithdrawnReward: "16",
  lastWithdrawnRewardDate: "2026-01-17T00:00:00.000Z",
  lastVotedDate: "2026-01-18T00:00:00.000Z",
};

const empty: TronResources = {
  frozen: { bandwidth: undefined, energy: undefined },
  unFrozen: { bandwidth: undefined, energy: undefined },
  delegatedFrozen: { bandwidth: undefined, energy: undefined },
  legacyFrozen: { bandwidth: undefined, energy: undefined },
  votes: [],
  tronPower: 0,
  energy: new BigNumber(0),
  bandwidth: {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  },
  unwithdrawnReward: new BigNumber(0),
  lastWithdrawnRewardDate: undefined,
  lastVotedDate: undefined,
};

const emptyRaw: TronResourcesRaw = {
  frozen: { bandwidth: undefined, energy: undefined },
  unFrozen: { bandwidth: undefined, energy: undefined },
  delegatedFrozen: { bandwidth: undefined, energy: undefined },
  legacyFrozen: { bandwidth: undefined, energy: undefined },
  votes: [],
  tronPower: 0,
  energy: "0",
  bandwidth: { freeUsed: "0", freeLimit: "0", gainedUsed: "0", gainedLimit: "0" },
  unwithdrawnReward: "0",
  lastWithdrawnRewardDate: undefined,
  lastVotedDate: undefined,
};

describe("toTronResourcesRaw", () => {
  it("writes every amount as a decimal string and every date as an ISO string", () => {
    expect(toTronResourcesRaw(full)).toEqual(fullRaw);
  });

  it("leaves the absent buckets absent", () => {
    expect(toTronResourcesRaw(empty)).toEqual(emptyRaw);
  });

  it("is JSON-safe", () => {
    const raw = toTronResourcesRaw(full);

    expect(JSON.parse(JSON.stringify(raw))).toEqual(raw);
  });

  it("reads resources stored before the unfrozen and legacy buckets existed", () => {
    const { unFrozen: _unFrozen, legacyFrozen: _legacyFrozen, ...older } = empty;

    expect(toTronResourcesRaw(older as TronResources)).toEqual(emptyRaw);
  });
});

describe("fromTronResourcesRaw", () => {
  it("revives every amount as a BigNumber and every date as a Date", () => {
    const revived = fromTronResourcesRaw(fullRaw);

    expect(revived).toEqual(full);
    expect(BigNumber.isBigNumber(revived.frozen.bandwidth?.amount)).toBe(true);
    expect(revived.unFrozen.energy?.[0].expireTime).toBeInstanceOf(Date);
  });

  it("leaves the absent buckets absent", () => {
    expect(fromTronResourcesRaw(emptyRaw)).toEqual(empty);
  });

  it("reads resources stored before the unfrozen and legacy buckets existed", () => {
    const { unFrozen: _unFrozen, legacyFrozen: _legacyFrozen, ...older } = emptyRaw;

    expect(fromTronResourcesRaw(older as TronResourcesRaw)).toEqual(empty);
  });

  it("round-trips through the JSON form", () => {
    expect(fromTronResourcesRaw(JSON.parse(JSON.stringify(toTronResourcesRaw(full))))).toEqual(
      full,
    );
  });
});
