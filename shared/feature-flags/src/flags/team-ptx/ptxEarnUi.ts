import { z } from "zod";
import { flagWith } from "../../define";

type EarnUiVersion = `v${number}`;

const DEFAULT_VERSION: EarnUiVersion = "v1";

const earnUiVersionSchema = z.coerce.string().transform((val): EarnUiVersion => {
  const bare = val.startsWith("v") ? val.slice(1) : val;
  const n = z.coerce.number().int().positive().safeParse(bare);
  return n.success ? `v${n.data}` : DEFAULT_VERSION;
});

export const ptxEarnUi = flagWith(
  {
    value: earnUiVersionSchema,
  },
  {
    enabled: false,
    params: { value: "v1" },
  },
);
