import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Push-Devices-backed api. An empty
 * `pushDevicesServiceUrl` disables sync — the base query soft-fails rather than throwing, so the app
 * can boot without the service configured.
 */
export const PushDevicesApiExtraSchema = z.object({
  pushDevicesServiceUrl: z.string().trim(),
  ledgerClientVersion: z.string().trim().min(1),
});
