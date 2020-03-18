// @flow
import { renderHook, act } from "@testing-library/react-hooks";
import {
  useTronSuperRepresentatives,
  useNextVotingDate,
  getNextRewardDate,
  formatVotes
} from "./react";

import { __NEXT_REWARD_DATE__, mockAccount, mockAccountNoReward } from "./mock";

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

test("Tron get next reward date - getNextRewardDate - Expect to get next reward date", () => {
  expect(getNextRewardDate(mockAccount)).toStrictEqual(
    __NEXT_REWARD_DATE__.valueOf() + 24 * 60 * 60 * 1000
  );
  expect(getNextRewardDate(mockAccountNoReward)).toStrictEqual(null);
});

const __VOTES__ = superRepresentatives
  .slice(0, 2)
  .map(({ address }) => ({ address, voteCount: 100 }));

const __FORMATTED_VOTES__ = superRepresentatives.slice(0, 2).map(validator => ({
  address: validator.address,
  voteCount: 100,
  validator
}));

test("Tron format votes - formatVotes - Expect to get formatted votes", () => {
  expect(formatVotes(undefined, superRepresentatives)).toStrictEqual([]);
  expect(formatVotes(__VOTES__, superRepresentatives)).toStrictEqual(
    __FORMATTED_VOTES__
  );
});
