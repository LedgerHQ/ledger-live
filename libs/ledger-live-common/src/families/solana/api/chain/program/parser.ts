import { ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js";
import { parseSplTokenInstruction, TokenInstructionDescriptor } from "../instruction/token";
import { PARSED_PROGRAMS } from "./constants";
import {
  AssociatedTokenAccountInstructionDescriptor,
  parseAssociatedTokenAccountInstruction,
} from "../instruction/associated-token-account";
import { MemoInstructionDescriptor, parseSplMemoInstruction } from "../instruction/memo";
import { parseStakeInstruction, StakeInstructionDescriptor } from "../instruction/stake";
import { parseSystemInstruction, SystemInstructionDescriptor } from "../instruction/system";

type ParsedProgram =
  | {
      program: "system";
      title: string;
      instruction: SystemInstructionDescriptor;
    }
  | {
      program: "spl-associated-token-account";
      title: string;
      instruction: AssociatedTokenAccountInstructionDescriptor;
    }
  | {
      program: "spl-memo";
      title: string;
      instruction: MemoInstructionDescriptor;
    }
  | {
      program: "stake";
      title: string;
      instruction: StakeInstructionDescriptor;
    }
  | {
      program: "spl-token";
      title: string;
      instruction: TokenInstructionDescriptor;
    }
  | {
      program: "unknown";
      title: "Unknown";
      instruction: undefined;
    };

export const parse = (ix: ParsedInstruction | PartiallyDecodedInstruction): ParsedProgram => {
  if ("parsed" in ix) {
    const program: (typeof PARSED_PROGRAMS)[keyof typeof PARSED_PROGRAMS] = ix.program as any;

    switch (program) {
      case "system":
        return {
          program,
          title: "System",
          instruction: parseSystemInstruction({
            ...ix,
            program,
          }),
        };
      case "spl-associated-token-account":
        return {
          program,
          title: "Associated Token Account",
          instruction: parseAssociatedTokenAccountInstruction({
            ...ix,
            program,
          }),
        };
      case "spl-memo":
        return {
          program,
          title: "Memo",
          instruction: parseSplMemoInstruction({
            ...ix,
            program,
          }),
        };
      case "stake":
        return {
          program,
          title: "Stake",
          instruction: parseStakeInstruction({
            ...ix,
            program,
          }),
        };
      case "spl-token":
        return {
          program,
          title: "Token",
          instruction: parseSplTokenInstruction({
            ...ix,
            program,
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
  } catch (_) {
    return unknown();
  }
};

function unknown(): {
  program: "unknown";
  title: "Unknown";
  instruction: undefined;
} {
  return {
    program: "unknown",
    title: "Unknown",
    instruction: undefined,
  } as const;
}
