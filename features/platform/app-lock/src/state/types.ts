import type { z } from "zod";
import type { AppLockStateSchema, AuthenticationTypeSchema } from "./schema";

export type AuthenticationType = z.infer<typeof AuthenticationTypeSchema>;
export type AppLockState = z.infer<typeof AppLockStateSchema>;
