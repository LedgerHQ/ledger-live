import { z } from "zod";
import { flagWith } from "../../define";

const deviceModelIdSchema = z.enum(["blue", "nanoS", "nanoSP", "nanoX", "stax", "europa", "apex"]);

const ignoredOsUpdatesByDeviceSchema = z.record(deviceModelIdSchema, z.array(z.string()));

export const onboardingIgnoredOsUpdates = flagWith(
  {
    ios: ignoredOsUpdatesByDeviceSchema.optional(),
    android: ignoredOsUpdatesByDeviceSchema.optional(),
    macos: ignoredOsUpdatesByDeviceSchema.optional(),
    windows: ignoredOsUpdatesByDeviceSchema.optional(),
    linux: ignoredOsUpdatesByDeviceSchema.optional(),
  },
  {
    enabled: false,
    params: {},
  },
);
