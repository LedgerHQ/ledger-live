/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { renderHook, act } from "@testing-library/react";
import {
  useTronSuperRepresentatives,
  getLastVotedDate,
  getNextRewardDate,
  formatVotes,
  getUnfreezeData,
  useVoteNames,
} from "./react";
import { accountNamesCache } from "@ledgerhq/coin-tron/network";
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

const accountNames: Record<string, string> = {
  TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH: "Binance Staking",
};

jest.mock("@ledgerhq/coin-tron/network", () => {
  return {
    getTronSuperRepresentatives: jest.fn().mockImplementation(() => {
      return Promise.resolve(superRepresentatives);
    }),
    accountNamesCache: jest.fn().mockImplementation((_config, address: string) => {
      return Promise.resolve(accountNames[address]);
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
  // useTronSuperRepresentatives resolves config via getCurrencyConfiguration (LiveConfig); the
  // network call is mocked, so a minimal entry is enough to avoid "Config not set".
  LiveConfig.setConfig({
    config_currency_tron: { type: "object", default: {} },
  } as never);
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

test("Tron get last voting date - getLastVotedDate - falls back to the newest VOTE operation", () => {
  // The generic coin framework's account-shape hook cannot populate `lastVotedDate` — it receives an
  // address, not the transaction list — so the operations are the only surviving source.
  const lastVote = new Date("2026-01-02T03:04:05.000Z");
  const account = {
    ...mockAccountNoVote,
    operations: [
      { type: "OUT", date: new Date("2026-02-01T00:00:00.000Z") },
      { type: "VOTE", date: lastVote },
      { type: "VOTE", date: new Date("2025-01-01T00:00:00.000Z") },
    ],
  } as unknown as typeof mockAccountNoVote;

  expect(getLastVotedDate(account)).toStrictEqual(lastVote);
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

describe("Tron vote names - useVoteNames", () => {
  const named = {
    name: "Binance Staking",
    address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
    voteCount: 3,
  };
  const nameless = { name: null, address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH", voteCount: 3 };

  beforeEach(() => {
    jest.mocked(accountNamesCache).mockClear();
  });

  it("resolves the name a just-submitted vote arrives without", async () => {
    const { result } = renderHook(() => useVoteNames([nameless]));

    expect(result.current).toEqual([nameless]);
    await act(async () => {});

    expect(result.current).toEqual([{ ...nameless, name: "Binance Staking" }]);
    expect(accountNamesCache).toHaveBeenCalledWith(expect.anything(), nameless.address);
  });

  it("leaves a synced vote alone, so the common case costs no request", async () => {
    const votes = [named];
    const { result } = renderHook(() => useVoteNames(votes));
    await act(async () => {});

    // Same reference, not merely equal: a new array here would re-render the details screen on
    // every sync.
    expect(result.current).toBe(votes);
    expect(accountNamesCache).not.toHaveBeenCalled();
  });

  it("only looks up the votes that are missing a name", async () => {
    const other = { name: null, address: "TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U", voteCount: 1 };
    const { result } = renderHook(() => useVoteNames([named, other]));
    await act(async () => {});

    expect(accountNamesCache).toHaveBeenCalledTimes(1);
    expect(accountNamesCache).toHaveBeenCalledWith(expect.anything(), other.address);
    // The second address has no name on chain, so it is left exactly as it arrived.
    expect(result.current).toEqual([named, other]);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty list", []],
  ])("passes %s straight through", async (_label, votes) => {
    const { result } = renderHook(() => useVoteNames(votes));
    await act(async () => {});

    expect(result.current).toBe(votes);
    expect(accountNamesCache).not.toHaveBeenCalled();
  });
});

test("Tron unfreeze - get unfreeze data - Expect to retrieve unfreeze data from account", () => {
  const { unfreezeBandwidth, unfreezeEnergy, canUnfreezeBandwidth, canUnfreezeEnergy } =
    getUnfreezeData(mockAccountV2);
  expect(unfreezeBandwidth.toString()).toBe("539000000");
  expect(unfreezeEnergy.toString()).toBe("28877000");
  expect(canUnfreezeBandwidth).toBe(true);
  expect(canUnfreezeEnergy).toBe(true);
});
