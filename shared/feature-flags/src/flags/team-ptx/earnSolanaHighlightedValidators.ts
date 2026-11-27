import { z } from "zod";
import { flagWith } from "../../define";

export const earnSolanaHighlightedValidators = flagWith(
  {
    validators: z.array(
      z.object({
        voteAccount: z.string(),
        provider: z.string().optional(),
        icon: z.string().optional(),
      }),
    ),
  },
  { enabled: false, params: { validators: [] } },
);
