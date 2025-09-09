import { ipcRenderer } from "electron";
import { setEnvUnsafe } from "@ledgerhq/live-env";

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
