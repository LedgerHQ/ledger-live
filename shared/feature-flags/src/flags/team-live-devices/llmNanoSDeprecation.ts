import { z } from "zod";
import { flagWith } from "../../define";

export const llmNanoSDeprecation = flagWith(
  {
    currencies: z.array(z.string()).optional(),
  },
  {
    enabled: false,
    params: { currencies: [] },
  },
);
