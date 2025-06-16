import { enums, type, string, Infer } from "superstruct";

type SaveInfo = Infer<typeof SaveInfo>;
export const SaveInfo = type({
  data: string(),
});

export type MemoInstructionType = Infer<typeof MemoInstructionType>;
// not a real instruction type, added for structure
export const MemoInstructionType = enums(["save"]);

export const IX_STRUCTS = {
  save: SaveInfo,
} as const;

export const IX_TITLES = {
  save: "Save",
} as const;
