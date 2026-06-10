import { z } from "zod";
import { flagWith } from "../../define";

const deviceModelIdSchema = z.enum(["blue", "nanoS", "nanoSP", "nanoX", "stax", "europa", "apex"]);

// Partial: configs only specify the device models they target.
const ignoredOsUpdatesByDeviceSchema = z.partialRecord(deviceModelIdSchema, z.array(z.string()));

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
