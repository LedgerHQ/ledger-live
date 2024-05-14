import { ParsedInstruction } from "@solana/web3.js";
import { IX_STRUCTS, IX_TITLES, SystemInstructionType } from "./types";

import { ParsedInfo } from "../../validators";
import { create, Infer } from "superstruct";
import { PARSED_PROGRAMS } from "../../program/constants";

export function parseSystemInstruction(
  ix: ParsedInstruction & { program: typeof PARSED_PROGRAMS.SYSTEM },
): SystemInstructionDescriptor {
  const parsed = create(ix.parsed, ParsedInfo);
  const { type: rawType, info } = parsed;
  const type = create(rawType, SystemInstructionType);
  const title = IX_TITLES[type];
  const struct = IX_STRUCTS[type];

  return {
    type,
    title: title as any,
    info: create(info, struct as any) as any,
  };
}

export type SystemInstructionDescriptor = {
  [K in SystemInstructionType]: {
    title: (typeof IX_TITLES)[K];
    type: K;
    info: Infer<(typeof IX_STRUCTS)[K]>;
  };
}[SystemInstructionType];
