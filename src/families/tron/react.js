// @flow
import { useState, useEffect } from "react";
import { getTronSuperRepresentatives, getNextVotingDate } from "../../api/Tron";

import type { SuperRepresentative, Vote } from "./types";
import type { Account } from "../../types";

/** Fetch the list of super representatives */
export const useTronSuperRepresentatives = (): Array<SuperRepresentative> => {
  const [sp, setSp] = useState([]);

  useEffect(() => {
    getTronSuperRepresentatives().then(setSp);
    return () => {};
  }, []);

  return sp;
};

/** Get next voting date window */
export const useNextVotingDate = (): ?number => {
  const [nextVotingDate, setNextVotingDate] = useState();
  useEffect(() => {
    getNextVotingDate().then(d => d && setNextVotingDate(d.valueOf()));
  }, []);

  return nextVotingDate;
};

/** Get next available date to claim rewards */
export const getNextRewardDate = (account: Account): ?number => {
  const { operations } = account;
  const lastRewardOp = operations.find(({ type }) => type === "REWARD");

  if (lastRewardOp) {
    const { date } = lastRewardOp;
    if (date) {
      // add 24hours
      const nextDate = date.getTime() + 24 * 60 * 60 * 1000;
      if (nextDate > Date.now()) return nextDate;
    }
  }

  return null;
};

/** format votes with superrepresentatives data */
export const formatVotes = (
  votes: ?Array<Vote>,
  superRepresentatives: ?Array<SuperRepresentative>
): Array<{| ...Vote, validator: ?SuperRepresentative |}> => {
  return votes
    ? votes.map(({ address, voteCount }) => ({
        validator:
          superRepresentatives &&
          superRepresentatives.find(sp => sp.address === address),
        address,
        voteCount
      }))
    : [];
};
