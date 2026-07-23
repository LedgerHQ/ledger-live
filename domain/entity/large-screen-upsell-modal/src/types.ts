import type { z } from "zod";
import type { LargeScreenUpsellModalStateSchema } from "./schema";

export type LargeScreenUpsellModalState = z.infer<typeof LargeScreenUpsellModalStateSchema>;
