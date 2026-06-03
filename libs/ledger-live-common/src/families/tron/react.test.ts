/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { setSupportedCurrencies } from "../../currencies/index";
setSupportedCurrencies(["tron"]);
import { renderHook, act } from "@testing-library/react";
import {
  useTronSuperRepresentatives,
  getLastVotedDate,
  getNextRewardDate,
  formatVotes,
  getUnfreezeData,
} from "./react";
import {
  __NEXT_REWARD_DATE__,
  __LAST_VOTING_DATE__,
  createMockAccount,
  createMockAccountNoReward,
  createMockAccountNoVote,
  createMockAccountV2,
} from "./data.mock";

const superRepresentatives = [
  {
    address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
    voteCount: 13540171796,
    isJobs: true,
    name: "Binance Staking",
    brokerage: 20,
  },
  {
    address: "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U",
    voteCount: 982530100,
    isJobs: true,
    name: "Skypeople",
    brokerage: 0,
  },
];

jest.mock("@ledgerhq/coin-tron/network", () => {
  return {
    getTronSuperRepresentatives: jest.fn().mockImplementation(() => {
      return Promise.resolve(superRepresentatives);
    }),
  };
});

jest.mock("@ledgerhq/coin-tron/logic/utils", () => {
  return {
    extractBandwidthInfo: jest.fn().mockImplementation(() => {
      return {
        freeUsed: 0,
        freeLimit: 0,
        gainedUsed: 0,
        gainedLimit: 0,
      };
    }),
  };
});

let mockAccount: Awaited<ReturnType<typeof createMockAccount>>;
let mockAccountNoReward: Awaited<ReturnType<typeof createMockAccountNoReward>>;
let mockAccountNoVote: Awaited<ReturnType<typeof createMockAccountNoVote>>;
let mockAccountV2: Awaited<ReturnType<typeof createMockAccountV2>>;

beforeAll(async () => {
  mockAccount = await createMockAccount();
  mockAccountNoReward = await createMockAccountNoReward();
  mockAccountNoVote = await createMockAccountNoVote();
  mockAccountV2 = await createMockAccountV2();
});

test("Tron SuperRepresentatives hook - useTronSuperRepresentatives - Expect super representatives list", async () => {
  const { result } = renderHook(() => useTronSuperRepresentatives());
  await act(async () => {
    expect(result.current).toStrictEqual([]);
  });

  process.nextTick(() => expect(result.current).toStrictEqual(superRepresentatives));
});

test("Tron get last voting date - getLastVotedDate - Expect to get last voted date", () => {
  expect(getLastVotedDate(mockAccount)).toStrictEqual(__LAST_VOTING_DATE__);
  expect(getLastVotedDate(mockAccountNoVote)).toStrictEqual(null);
});

test("Tron get next reward date - getNextRewardDate - Expect to get next reward date", () => {
  expect(getNextRewardDate(mockAccount)).toStrictEqual(
    __NEXT_REWARD_DATE__.valueOf() + 24 * 60 * 60 * 1000,
  );
  expect(getNextRewardDate(mockAccountNoReward)).toStrictEqual(null);
});

const __VOTES__ = superRepresentatives.slice(0, 2).map(({ name, address }) => ({
  name,
  address,
  voteCount: 100,
}));

const __FORMATTED_VOTES__ = superRepresentatives.slice(0, 2).map(validator => ({
  address: validator.address,
  voteCount: 100,
  name: validator.name,
  isSR: true,
}));

test("Tron format votes - formatVotes - Expect to get formatted votes", () => {
  expect(formatVotes(undefined, superRepresentatives as any[])).toStrictEqual([]);
  expect(formatVotes(__VOTES__, superRepresentatives as any[])).toStrictEqual(__FORMATTED_VOTES__);
});

test("Tron unfreeze - get unfreeze data - Expect to retrieve unfreeze data from account", () => {
  const { unfreezeBandwidth, unfreezeEnergy, canUnfreezeBandwidth, canUnfreezeEnergy } =
    getUnfreezeData(mockAccountV2);
  expect(unfreezeBandwidth.toString()).toBe("539000000");
  expect(unfreezeEnergy.toString()).toBe("28877000");
  expect(canUnfreezeBandwidth).toBe(true);
  expect(canUnfreezeEnergy).toBe(true);
});
