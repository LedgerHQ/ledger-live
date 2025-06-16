import { ParsedInfo } from "../../validators";
import { create, Infer } from "superstruct";
import { ParsedInstruction } from "@solana/web3.js";
import { AssociatedTokenAccountInstructionType, IX_STRUCTS, IX_TITLES } from "./types";

import { PARSED_PROGRAMS } from "../../program/constants";

export function parseAssociatedTokenAccountInstruction(
  ix: ParsedInstruction & {
    program: typeof PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT;
  },
): AssociatedTokenAccountInstructionDescriptor {
  // TODO: check this
  const parsed = create(ix.parsed, ParsedInfo);
  //const { type: rawType, info } = parsed;
  const type: AssociatedTokenAccountInstructionType = "associate";
  const title = IX_TITLES[type];
  const struct = IX_STRUCTS[type];

  return {
    type: "associate",
    title: title,
    info: create(parsed.info, struct as any) as any,
  };
}

export type AssociatedTokenAccountInstructionDescriptor = {
  [K in AssociatedTokenAccountInstructionType]: {
    title: (typeof IX_TITLES)[K];
    type: K;
    info: Infer<(typeof IX_STRUCTS)[K]>;
  };
}[AssociatedTokenAccountInstructionType];
