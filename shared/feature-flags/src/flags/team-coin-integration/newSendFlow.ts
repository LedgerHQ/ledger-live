import { z } from "zod";
import { flagWith } from "../../define";

export const newSendFlow = flagWith(
  {
    families: z.array(z.string()).optional(),
  },
  {
    enabled: false,
    params: { families: [] },
  },
);
