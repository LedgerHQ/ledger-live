import { getEnv } from "@shared/env";

/** Whether currencies are served by their mock bridges, and new accounts get a `mock` id. */
export const usesMockBridges = (): boolean => !!getEnv("MOCK");
