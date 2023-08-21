import { ipcRenderer } from "electron";
import { EnvName, setEnvUnsafe } from "@ledgerhq/live-env";

// List of environment variables for which killing internal process is necessary
// (I must admit having considered calling this `bloodThirstyEnvs`)
const envsNeedingRestart = ["EXPERIMENTAL_USB"];

export const isRestartNeeded = (envName: EnvName) => envsNeedingRestart.includes(envName);
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
