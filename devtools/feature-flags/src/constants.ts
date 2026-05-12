import { FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId } from "@shared/feature-flags";

export const ALL_FLAG_IDS: FeatureId[] = [...FeatureIdSchema.options];
