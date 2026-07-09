import { z } from "zod";

export const PushDevicesApiExtraSchema = z.object({
  pushDevicesServiceUrl: z.string(),
  ledgerClientVersion: z.string().min(1),
});
