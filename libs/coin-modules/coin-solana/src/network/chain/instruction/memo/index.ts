import { ParsedInstruction } from "@solana/web3.js";
import { IX_STRUCTS, IX_TITLES, MemoInstructionType } from "./types";
import { Infer } from "superstruct";
import { PARSED_PROGRAMS } from "../../program/constants";

export function parseSplMemoInstruction(
  ix: ParsedInstruction & { program: typeof PARSED_PROGRAMS.SPL_MEMO },
): MemoInstructionDescriptor {
  return {
    title: "Save",
    type: "save",
    info: {
      data: ix.parsed,
    },
  };
}

export type MemoInstructionDescriptor = {
  [K in MemoInstructionType]: {
    title: (typeof IX_TITLES)[K];
    type: K;
    info: Infer<(typeof IX_STRUCTS)[K]>;
  };
}[MemoInstructionType];
