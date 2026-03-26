import { z } from "zod";
import { flagWith } from "../../define";

export const addressPoisoningOperationsFilter = flagWith(
  {
    families: z.array(z.string()),
  },
  {
    enabled: true,
    params: {
      families: [
        "evm",
        "tron",
        "solana",
        "xrp",
        "stellar",
        "hedera",
        "algorand",
        "cardano",
        "cosmos",
      ],
    },
  },
);
