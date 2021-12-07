import { ParsedInfo } from "../../validators";
import { create, Infer } from "superstruct";
import { ParsedInstruction } from "@solana/web3.js";
import { StakeInstructionType, IX_STRUCTS, IX_TITLES } from "./types";
import { PARSED_PROGRAMS } from "../../program/constants";

export function parseStakeInstruction(
  ix: ParsedInstruction & { program: typeof PARSED_PROGRAMS.STAKE }
): StakeInstructionDescriptor {
  const parsed = create(ix.parsed, ParsedInfo);
  const { type: rawType, info } = parsed;
  const type = create(rawType, StakeInstructionType);
  const title = IX_TITLES[type];
  const struct = IX_STRUCTS[type];

  return {
    type,
    title: title as any,
    info: create(info, struct as any) as any,
  };
}

export type StakeInstructionDescriptor = {
  [K in StakeInstructionType]: {
    title: typeof IX_TITLES[K];
    type: K;
    info: Infer<typeof IX_STRUCTS[K]>;
  };
}[StakeInstructionType];
