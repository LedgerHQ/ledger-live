import { z } from "zod";
import { flagWith } from "../../define";

export const ldmkTransport = flagWith(
  {
    warningVisible: z.boolean(),
  },
  {
    enabled: false,
    params: { warningVisible: true },
  },
);
