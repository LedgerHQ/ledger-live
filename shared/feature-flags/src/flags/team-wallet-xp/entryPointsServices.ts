import { z } from "zod";
import { flagWith } from "../../define";

export const entryPointsServices = flagWith(
  {
    services: z.array(z.enum(["perps", "borrow", "predictions"])),
  },
  {
    enabled: false,
    params: {
      services: ["perps", "borrow"],
    },
  },
);
