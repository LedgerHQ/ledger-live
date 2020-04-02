// @flow
import { renderHook, act } from "@testing-library/react-hooks";
import {
  useTronSuperRepresentatives,
  useNextVotingDate,
  getLastVotedDate,
  getNextRewardDate,
  formatVotes,
  useSortedSr,
  useVotesReducer
} from "./react";

import {
  __NEXT_REWARD_DATE__,
  __LAST_VOTING_DATE__,
  mockAccount,
  mockAccountNoReward,
  mockAccountNoVote
} from "./mock";

jest.mock("../../api/Tron");

import superRepresentatives from "../../api/__mocks__/superRepresentativesData";
import { __NEXT_VOTING_DATE__ } from "../../api/__mocks__/Tron.js";

test("Tron SuperRepresentatives hook - useTronSuperRepresentatives - Expect super representatives list", async () => {
  const { result } = renderHook(() => useTronSuperRepresentatives());
  await act(async () => {
    expect(result.current).toStrictEqual([]);
  });
  process.nextTick(() => expect(result.current).toBe(superRepresentatives));
});

test("Tron next voting date hook - useNextVotingDate - Expect to get next voting date", async () => {
  const { result } = renderHook(() => useNextVotingDate());
  await act(async () => {
    expect(result.current).toBeUndefined();
  });
  process.nextTick(() =>
    expect(result.current).toBe(__NEXT_VOTING_DATE__.valueOf())
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

const __VOTES__ = superRepresentatives
  .slice(0, 2)
  .map(({ address }) => ({ address, voteCount: 100 }));

const __FORMATTED_VOTES__ = superRepresentatives
  .slice(0, 2)
  .map((validator, i) => ({
    address: validator.address,
    voteCount: 100,
    validator,
    rank: i + 1,
    isSR: true
  }));

test("Tron format votes - formatVotes - Expect to get formatted votes", () => {
  expect(formatVotes(undefined, superRepresentatives)).toStrictEqual([]);
  expect(formatVotes(__VOTES__, superRepresentatives)).toStrictEqual(
    __FORMATTED_VOTES__
  );
});

const SR_INDEX_1 = 9;
const SR_INDEX_2 = 2;
const SR_INDEX_3 = 1;

const VOTE_AMOUNT_1 = 10;
const VOTE_AMOUNT_2 = 50;
const VOTE_AMOUNT_3 = 60;

const votes = [
  {
    address: superRepresentatives[SR_INDEX_1].address,
    voteCount: VOTE_AMOUNT_1
  },
  {
    address: superRepresentatives[SR_INDEX_2].address,
    voteCount: VOTE_AMOUNT_2
  }
];

const formattedVotes = {
  [superRepresentatives[SR_INDEX_1].address]: VOTE_AMOUNT_1,
  [superRepresentatives[SR_INDEX_2].address]: VOTE_AMOUNT_2
};

test("Tron search SR - search SR in the list - Expect to retrieve a specific list SR", () => {
  const { result } = renderHook(() =>
    useSortedSr(
      superRepresentatives[SR_INDEX_1].name,
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
    useSortedSr("", superRepresentatives, votes)
  );
  act(() => {
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBe(superRepresentatives.length);
    expect(result.current[0].address).toBe(votes[1].address);
    expect(result.current[1].address).toBe(votes[0].address);
  });
});

test("Tron vote State - manage tron voting state - Expect to retrieve the current voting state", () => {
  const { tronResources } = mockAccount;
  const tronPower = tronResources ? tronResources.tronPower : 0;

  const UPDATE_ACTION = {
    type: "updateVote",
    address: superRepresentatives[SR_INDEX_3].address,
    value: String(VOTE_AMOUNT_3)
  };

  const RESET_ACTION = {
    type: "resetVotes"
  };

  const CLEAR_ACTION = {
    type: "clearVotes"
  };

  const DEFAULT_ACTION = {};

  const INIT_STATE = {
    initialVotes: formattedVotes,
    max: tronPower - (VOTE_AMOUNT_1 + VOTE_AMOUNT_2),
    votes: formattedVotes,
    votesAvailable: tronPower,
    votesSelected: 2,
    votesUsed: VOTE_AMOUNT_1 + VOTE_AMOUNT_2
  };

  const UPDATED_STATE = {
    initialVotes: formattedVotes,
    max: tronPower - (VOTE_AMOUNT_1 + VOTE_AMOUNT_2 + VOTE_AMOUNT_3),
    votes: {
      ...formattedVotes,
      [superRepresentatives[SR_INDEX_3].address]: VOTE_AMOUNT_3
    },
    votesAvailable: tronPower,
    votesSelected: 3,
    votesUsed: VOTE_AMOUNT_1 + VOTE_AMOUNT_2 + VOTE_AMOUNT_3
  };

  const CLEAR_STATE = {
    initialVotes: formattedVotes,
    max: tronPower,
    votes: {},
    votesAvailable: tronPower,
    votesSelected: 0,
    votesUsed: 0
  };

  const { result } = renderHook(() => useVotesReducer(votes, tronResources));

  expect(Array.isArray(result.current)).toStrictEqual(true);
  expect(result.current[0]).toStrictEqual(INIT_STATE);
  expect(typeof result.current[1] === "function").toBe(true);

  act(() => {
    result.current[1](UPDATE_ACTION);
  });
  expect(result.current[0]).toStrictEqual(UPDATED_STATE);

  act(() => {
    result.current[1](CLEAR_ACTION);
  });

  expect(result.current[0]).toStrictEqual(CLEAR_STATE);

  act(() => {
    result.current[1](RESET_ACTION);
  });

  expect(result.current[0]).toStrictEqual(INIT_STATE);

  act(() => {
    result.current[1](DEFAULT_ACTION);
  });
  expect(result.current[0]).toStrictEqual(INIT_STATE);
});
