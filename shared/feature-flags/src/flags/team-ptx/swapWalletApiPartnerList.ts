import { z } from "zod";
import { flagWith } from "../../define";

export const swapWalletApiPartnerList = flagWith({
  list: z.array(z.string()),
});
