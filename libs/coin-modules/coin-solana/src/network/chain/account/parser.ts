import { ParsedAccountData } from "@solana/web3.js";
import { create } from "superstruct";
import { isTokenProgram } from "../../../helpers/token";
import { PARSED_PROGRAMS } from "../program/constants";
import { ParsedInfo } from "../validators";
import { StakeAccount, StakeAccountInfo, StakeHistoryEntry } from "./stake";
import { MintAccountInfo, TokenAccount, TokenAccountInfo } from "./token";
import { VoteAccount, VoteAccountInfo } from "./vote";

export function parseMintAccountInfo(info: unknown): MintAccountInfo {
  return create(info, MintAccountInfo);
}

export function tryParseAsMintAccount(
  data: ParsedAccountData,
): MintAccountInfo | undefined | Error {
  const routine = () => {
    const info = create(data.parsed, ParsedInfo);

    if (isTokenProgram(data.program)) {
      const parsed = create(info, TokenAccount);
      if (parsed.type === "mint") {
        return parseMintAccountInfo(parsed.info);
      }
    }

    return undefined;
  };

  return onThrowReturnError(routine);
}

export function parseTokenAccountInfo(info: unknown): TokenAccountInfo {
  return create(info, TokenAccountInfo);
}

export function tryParseAsTokenAccount(
  data: ParsedAccountData,
): TokenAccountInfo | undefined | Error {
  const routine = () => {
    const info = create(data.parsed, ParsedInfo);

    if (isTokenProgram(data.program)) {
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

export function tryParseAsStakeAccount(
  data: ParsedAccountData,
): StakeAccountInfo | undefined | Error {
  const routine = () => {
    const info = create(data.parsed, ParsedInfo);
    const parsed = create(info, StakeAccount);
    return parseStakeAccountInfo(parsed.info);
  };

  return onThrowReturnError(routine);
}

export function parseStakeHistoryEntry(entry: unknown) {
  return create(entry, StakeHistoryEntry);
}

function onThrowReturnError<R>(fn: () => R) {
  try {
    return fn();
  } catch (e) {
    return e instanceof Error ? e : new Error(JSON.stringify(e));
  }
}
