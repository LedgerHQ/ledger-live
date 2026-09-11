import { setEnvUnsafe } from "@shared/env";

/**
 * Sets an env variable for the renderer thread only. Main seeds its own from `process.env`
 * (src/main/setup.ts); the two are populated independently, not kept in sync.
 */
export const setEnvOnAllThreads = (name: string, value: unknown): boolean =>
  setEnvUnsafe(name, value);
