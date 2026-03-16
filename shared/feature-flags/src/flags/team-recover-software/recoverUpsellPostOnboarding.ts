import { z } from "zod";
import { flagWith } from "../../define";

const deviceModelIdSchema = z.enum(["blue", "nanoS", "nanoSP", "nanoX", "stax", "europa", "apex"]);

export const recoverUpsellPostOnboarding = flagWith(
  {
    deviceIds: z.array(deviceModelIdSchema),
  },
  {
    enabled: false,
    params: {
      deviceIds: ["nanoSP", "nanoX", "stax", "europa", "apex"],
    },
  },
);
