import { z } from "zod";
import { flagWith } from "../../define";

export const ptxSwapMfe = flagWith(
  { baseUrl: z.string() },
  {
    // TODO: replace with the real deployed base URL once the swap remote is hosted.
    params: { baseUrl: "https://TBD.ledger.com/swap" },
  },
);
