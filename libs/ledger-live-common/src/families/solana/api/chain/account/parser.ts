import { ParsedAccountData } from "@solana/web3.js";
import { create } from "superstruct";
import { PARSED_PROGRAMS } from "../program/constants";
import { ParsedInfo } from "../validators";
import { StakeAccountInfo } from "./stake";
import { TokenAccount, TokenAccountInfo } from "./token";
import { VoteAccount, VoteAccountInfo } from "./vote";

export function parseTokenAccountInfo(info: unknown): TokenAccountInfo {
  return create(info, TokenAccountInfo);
}

export function tryParseAsTokenAccount(
  data: ParsedAccountData,
): TokenAccountInfo | undefined | Error {
  const routine = () => {
    const info = create(data.parsed, ParsedInfo);

    if (data.program === "spl-token") {
      const parsed = create(info, TokenAccount);
      if (parsed.type === "account") {
        return parseTokenAccountInfo(parsed.info);
      }
    }

    return undefined;
  };

  return onThrowReturnError(routine);
}

export function parseVoteAccountInfo(info: unknown): VoteAccountInfo {
  return create(info, VoteAccountInfo);
}

export function tryParseAsVoteAccount(
  data: ParsedAccountData,
): VoteAccountInfo | undefined | Error {
  const routine = () => {
    const info = create(data.parsed, ParsedInfo);

    if (data.program === PARSED_PROGRAMS.VOTE) {
      const parsed = create(info, VoteAccount);
      return parseVoteAccountInfo(parsed.info);
    }

    return undefined;
  };

  return onThrowReturnError(routine);
}

export function parseStakeAccountInfo(info: unknown): StakeAccountInfo {
  return create(info, StakeAccountInfo);
}

function onThrowReturnError<R>(fn: () => R) {
  try {
    return fn();
  } catch (e) {
    return e instanceof Error ? e : new Error(JSON.stringify(e));
  }
}
