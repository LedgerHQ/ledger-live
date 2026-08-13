import { z } from "zod";

export const DeviceModelIdSchema = z.enum([
  "blue",
  "nanoS",
  "nanoSP",
  "nanoX",
  "stax",
  "europa",
  "apex",
]);

export type DeviceModelId = z.infer<typeof DeviceModelIdSchema>;
