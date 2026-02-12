import { ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js";
import {
  AssociatedTokenAccountInstructionDescriptor,
  parseAssociatedTokenAccountInstruction,
} from "../instruction/associated-token-account";
import { MemoInstructionDescriptor, parseSplMemoInstruction } from "../instruction/memo";
import { parseStakeInstruction, StakeInstructionDescriptor } from "../instruction/stake";
import { parseSystemInstruction, SystemInstructionDescriptor } from "../instruction/system";
import { parseSplTokenInstruction, TokenInstructionDescriptor } from "../instruction/token";
import { PARSED_PROGRAMS } from "./constants";

type UnknownProgram = {
  program: typeof PARSED_PROGRAMS.UNKNOWN;
  title: "Unknown";
  instruction: undefined;
};

type ParsedProgram =
  | {
      program: typeof PARSED_PROGRAMS.SYSTEM;
      title: string;
      instruction: SystemInstructionDescriptor;
    }
  | {
      program: typeof PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT;
      title: string;
      instruction: AssociatedTokenAccountInstructionDescriptor;
    }
  | {
      program: typeof PARSED_PROGRAMS.SPL_MEMO;
      title: string;
      instruction: MemoInstructionDescriptor;
    }
  | {
      program: typeof PARSED_PROGRAMS.STAKE;
      title: string;
      instruction: StakeInstructionDescriptor;
    }
  | {
      program: typeof PARSED_PROGRAMS.SPL_TOKEN;
      title: string;
      instruction: TokenInstructionDescriptor;
    }
  | {
      program: typeof PARSED_PROGRAMS.SPL_TOKEN_2022;
      title: string;
      instruction: TokenInstructionDescriptor;
    }
  | UnknownProgram;

export const parse = (ix: ParsedInstruction | PartiallyDecodedInstruction): ParsedProgram => {
  if ("parsed" in ix) {
    switch (ix.program) {
      case PARSED_PROGRAMS.SYSTEM:
        return {
          program: ix.program,
          title: "System",
          instruction: parseSystemInstruction({
            ...ix,
            program: ix.program,
          }),
        };
      case PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT:
        return {
          program: ix.program,
          title: "Associated Token Account",
          instruction: parseAssociatedTokenAccountInstruction({
            ...ix,
            program: ix.program,
          }),
        };
      case PARSED_PROGRAMS.SPL_MEMO:
        return {
          program: ix.program,
          title: "Memo",
          instruction: parseSplMemoInstruction({
            ...ix,
            program: ix.program,
          }),
        };
      case PARSED_PROGRAMS.STAKE:
        return {
          program: ix.program,
          title: "Stake",
          instruction: parseStakeInstruction({
            ...ix,
            program: ix.program,
          }),
        };
      case PARSED_PROGRAMS.SPL_TOKEN:
        return {
          program: ix.program,
          title: "Token",
          instruction: parseSplTokenInstruction({
            ...ix,
            program: ix.program,
          }),
        };
      case PARSED_PROGRAMS.SPL_TOKEN_2022:
        return {
          program: ix.program,
          title: "Token2022",
          instruction: parseSplTokenInstruction({
            ...ix,
            program: ix.program,
          }),
        };
      default:
        return unknown();
    }
  }

  return unknown();
};

export const parseQuiet = (ix: ParsedInstruction | PartiallyDecodedInstruction): ParsedProgram => {
  try {
    return parse(ix);
  } catch {
    return unknown();
  }
};

function unknown(): UnknownProgram {
  return {
    program: PARSED_PROGRAMS.UNKNOWN,
    title: "Unknown",
    instruction: undefined,
  };
}
