import { z } from "zod";

export const CardApiExtraSchema = z.object({
  cardApiBaseUrl: z.string().min(1),
  cardBaanxClientKey: z.string(),
  getCardSessionToken: z.custom<() => string | null | undefined>(
    value => typeof value === "function",
    { message: "getCardSessionToken must be a function" },
  ),
  refreshCardSession: z.custom<() => Promise<string | null | undefined>>(
    value => typeof value === "function",
    { message: "refreshCardSession must be a function" },
  ),
});
