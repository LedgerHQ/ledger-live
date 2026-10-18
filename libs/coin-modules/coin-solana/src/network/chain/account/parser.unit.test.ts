import type { ParsedAccountData } from "@solana/web3.js";
import { PARSED_PROGRAMS } from "../program/constants";
import { tryParseAsStakeAccount, tryParseAsVoteAccount } from "./parser";

const VALIDATOR = "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4";

const voteAccount: ParsedAccountData = {
  parsed: {
    info: {
      authorizedVoters: [{ authorizedVoter: VALIDATOR, epoch: 283 }],
      authorizedWithdrawer: VALIDATOR,
      commission: 7,
      epochCredits: [{ credits: "98854605", epoch: 283, previousCredits: "98728105" }],
      lastTimestamp: { slot: 122422797, timestamp: 1645796249 },
      nodePubkey: VALIDATOR,
      priorVoters: [],
      rootSlot: 122422766,
      votes: [{ confirmationCount: 1, slot: 122422797 }],
    },
    type: "vote",
  },
  program: PARSED_PROGRAMS.VOTE,
  space: 3731,
};

describe("tryParseAsVoteAccount", () => {
  it("parses a vote account", () => {
    const parsed = tryParseAsVoteAccount(voteAccount);

    expect(parsed).not.toBeInstanceOf(Error);
    expect(parsed).toMatchObject({ commission: 7, rootSlot: 122422766 });
    expect(parsed && !(parsed instanceof Error) && parsed.nodePubkey.toBase58()).toBe(VALIDATOR);
  });

  it("ignores accounts owned by another program", () => {
    expect(tryParseAsVoteAccount({ ...voteAccount, program: PARSED_PROGRAMS.STAKE })).toBe(
      undefined,
    );
  });

  it("returns the validation error of a malformed vote account", () => {
    const malformed = { ...voteAccount, parsed: { type: "vote", info: { commission: "7" } } };

    expect(tryParseAsVoteAccount(malformed)).toBeInstanceOf(Error);
  });
});

describe("tryParseAsStakeAccount", () => {
  it("returns the validation error of a non-stake account", () => {
    expect(tryParseAsStakeAccount(voteAccount)).toBeInstanceOf(Error);
  });
});
