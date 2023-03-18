import { setSupportedCurrencies } from "../../currencies/index";
setSupportedCurrencies(["tron"]);
import { renderHook, act } from "@testing-library/react-hooks";
import {
  useTronSuperRepresentatives,
  getLastVotedDate,
  getNextRewardDate,
  formatVotes,
  useSortedSr,
  getUnfreezeData,
} from "./react";
import {
  __NEXT_REWARD_DATE__,
  __LAST_VOTING_DATE__,
  mockAccount,
  mockAccountNoReward,
  mockAccountNoVote,
} from "./data.mock";
jest.mock("../../api/Tron");
import superRepresentatives from "../../api/__mocks__/superRepresentativesData";
test("Tron SuperRepresentatives hook - useTronSuperRepresentatives - Expect super representatives list", async () => {
  const { result } = renderHook(() => useTronSuperRepresentatives());
  await act(async () => {
    expect(result.current).toStrictEqual([]);
  });
  process.nextTick(() =>
    expect(result.current).toStrictEqual(superRepresentatives)
  );
});
test("Tron get last voting date - getLastVotedDate - Expect to get last voted date", () => {
  expect(getLastVotedDate(mockAccount)).toStrictEqual(__LAST_VOTING_DATE__);
  expect(getLastVotedDate(mockAccountNoVote)).toStrictEqual(null);
});
test("Tron get next reward date - getNextRewardDate - Expect to get next reward date", () => {
  expect(getNextRewardDate(mockAccount)).toStrictEqual(
    __NEXT_REWARD_DATE__.valueOf() + 24 * 60 * 60 * 1000
  );
  expect(getNextRewardDate(mockAccountNoReward)).toStrictEqual(null);
});

const __VOTES__ = superRepresentatives.slice(0, 2).map(({ address }) => ({
  address,
  voteCount: 100,
}));

const __FORMATTED_VOTES__ = superRepresentatives
  .slice(0, 2)
  .map((validator, i) => ({
    address: validator.address,
    voteCount: 100,
    validator,
    rank: i + 1,
    isSR: true,
  }));

test("Tron format votes - formatVotes - Expect to get formatted votes", () => {
  expect(formatVotes(undefined, superRepresentatives as any[])).toStrictEqual(
    []
  );
  expect(formatVotes(__VOTES__, superRepresentatives as any[])).toStrictEqual(
    __FORMATTED_VOTES__
  );
});
const SR_INDEX_1 = 9;
const SR_INDEX_2 = 2;
const VOTE_AMOUNT_1 = 10;
const VOTE_AMOUNT_2 = 50;
const votes = [
  {
    address: superRepresentatives[SR_INDEX_1].address,
    voteCount: VOTE_AMOUNT_1,
  },
  {
    address: superRepresentatives[SR_INDEX_2].address,
    voteCount: VOTE_AMOUNT_2,
  },
];
test("Tron search SR - search SR in the list - Expect to retrieve a specific list SR", () => {
  const { result } = renderHook(() =>
    useSortedSr(
      superRepresentatives[SR_INDEX_1].name as string,
      // @ts-expect-error wat
      superRepresentatives,
      votes
    )
  );
  act(() => {
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current[0].address).toBe(
      superRepresentatives[SR_INDEX_1].address
    );
  });
});
test("Tron search SR - search SR in the list - Expect to retrieve all the list if no search provided and sorted by votes", () => {
  const { result } = renderHook(() =>
    useSortedSr("", superRepresentatives as any[], votes)
  );
  act(() => {
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBe(superRepresentatives.length);
    expect(result.current[0].address).toBe(votes[1].address);
    expect(result.current[1].address).toBe(votes[0].address);
  });
});
test("Tron unfreeze - get unfreeze data - Expect to retrieve unfreeze data from account", () => {
  const {
    unfreezeBandwidth,
    unfreezeEnergy,
    canUnfreezeBandwidth,
    canUnfreezeEnergy,
    bandwidthExpiredAt,
    energyExpiredAt,
  } = getUnfreezeData(mockAccount);
  expect(unfreezeBandwidth.toString()).toBe("375000000");
  expect(unfreezeEnergy.toString()).toBe("0");
  expect(canUnfreezeBandwidth).toBe(true);
  expect(canUnfreezeEnergy).toBe(false);
  expect(bandwidthExpiredAt).toBeDefined();
  expect(energyExpiredAt).toBeNull();
});
