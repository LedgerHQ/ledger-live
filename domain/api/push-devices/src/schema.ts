import { z } from "zod";

export const PushDevicesApiExtraSchema = z.object({
  pushDevicesServiceUrl: z.string().trim(),
  ledgerClientVersion: z.string().trim().min(1),
});
