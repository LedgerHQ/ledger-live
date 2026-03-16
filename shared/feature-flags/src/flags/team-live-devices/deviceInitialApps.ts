import { z } from "zod";
import { flagWith } from "../../define";

export const deviceInitialApps = flagWith(
  {
    apps: z.array(z.string()),
  },
  {
    enabled: true,
    params: { apps: ["Bitcoin", "Ethereum"] },
  },
);
