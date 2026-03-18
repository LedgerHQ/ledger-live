import { z } from "zod";
import { flagWith } from "../../define";

export const buyDeviceFromLive = flagWith(
  {
    debug: z.boolean(),
    url: z.string().nullable(),
  },
  {
    enabled: false,
    params: { debug: false, url: null },
  },
);
