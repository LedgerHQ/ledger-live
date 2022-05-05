import { enums, type, Infer } from "superstruct";
import { PublicKeyFromString } from "../../validators/pubkey";

type AssociateInfo = Infer<typeof AssociateInfo>;
export const AssociateInfo = type({
  account: PublicKeyFromString,
  mint: PublicKeyFromString,
  wallet: PublicKeyFromString,
});

export type AssociatedTokenAccountInstructionType = Infer<
  typeof AssociatedTokenAccountInstructionType
>;
// not a real instruction type, added for structure
export const AssociatedTokenAccountInstructionType = enums(["associate"]);

export const IX_STRUCTS = {
  associate: AssociateInfo,
} as const;

export const IX_TITLES = {
  associate: "Associate",
} as const;
