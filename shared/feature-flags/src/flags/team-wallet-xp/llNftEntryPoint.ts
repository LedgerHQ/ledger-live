import { z } from "zod";
import { flagWith } from "../../define";

export const llNftEntryPoint = flagWith(
  {
    magiceden: z.boolean(),
    opensea: z.boolean(),
    chains: z.array(z.string()),
  },
  {
    enabled: false,
    params: {
      opensea: false,
      magiceden: false,
      chains: ["ethereum", "polygon", "base", "arbitrum"],
    },
  },
);
