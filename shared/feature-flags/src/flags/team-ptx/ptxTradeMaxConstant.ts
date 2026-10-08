import { z } from "zod";
import { flagWith } from "../../define";

/** Fee buffer kept back from a max deposit, per currency id, in main units. */
export const ptxTradeMaxConstant = flagWith(
  { constants: z.record(z.string(), z.string()) },
  { enabled: false, params: { constants: {} } },
);
