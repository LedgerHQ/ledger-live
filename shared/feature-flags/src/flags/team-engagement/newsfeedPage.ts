import { z } from "zod";
import { flagWith } from "../../define";

export const newsfeedPage = flagWith({
  cryptopanicApiKey: z.string(),
  whitelistedLocales: z.array(z.string()),
});
