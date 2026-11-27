import type { z } from "zod";
import type { AgentIntentApiExtraSchema } from "./schema";

export type AgentIntentApiExtra = z.infer<typeof AgentIntentApiExtraSchema>;
