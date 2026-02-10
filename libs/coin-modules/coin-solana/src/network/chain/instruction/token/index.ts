import { ParsedInstruction } from "@solana/web3.js";
import { create, Infer } from "superstruct";
import { SolanaTokenProgram } from "../../../../types";
import { ParsedInfo } from "../../validators";
import { IX_STRUCTS, IX_TITLES, TokenInstructionType } from "./types";

export function parseSplTokenInstruction(
  ix: ParsedInstruction & { program: SolanaTokenProgram },
): TokenInstructionDescriptor {
  const parsed = create(ix.parsed, ParsedInfo);
  const { type: rawType, info } = parsed;
  const type = create(rawType, TokenInstructionType);
  const title = IX_TITLES[type];
  const struct = IX_STRUCTS[type];

  // TODO type this correctly if possible
  return {
    type,
    title,
    info: create(info, struct as any),
  } as TokenInstructionDescriptor;
}

export type TokenInstructionDescriptor = {
  [K in TokenInstructionType]: {
    title: (typeof IX_TITLES)[K];
    type: K;
    info: Infer<(typeof IX_STRUCTS)[K]>;
  };
}[TokenInstructionType];
