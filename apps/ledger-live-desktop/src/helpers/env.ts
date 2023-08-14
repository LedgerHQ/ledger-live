import { ipcRenderer } from "electron";
import { setEnvUnsafe } from "@ledgerhq/live-common/env";

// List of environment variables for which killing internal process is necessary
// (I must admit having considered calling this `bloodThirstyEnvs`)
const envsNeedingRestart = ["EXPERIMENTAL_USB"];

// `isSacrificeDemanded` sounded cooler also 😈
export const isRestartNeeded = (envName: string) => envsNeedingRestart.includes(envName);
export const setEnvOnAllThreads = (name: string, value: unknown): boolean => {
  if (setEnvUnsafe(name, value)) {
    const env = {
      name,
      value,
    };
    ipcRenderer.send("setEnv", env);
    return true;
  }
  return false;
};
