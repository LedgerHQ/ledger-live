import { z } from "zod";
import { flagWith } from "../../define";

export const fetchAdditionalCoins = flagWith({
  batch: z.number(),
});
