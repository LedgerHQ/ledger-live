import { setEnvUnsafe } from "@shared/env";

export const setEnvOnAllThreads = (name: string, value: unknown): boolean =>
  setEnvUnsafe(name, value);
