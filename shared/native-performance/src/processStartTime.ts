import { NativeModules } from "react-native";

interface AppStartupNativeModule {
  getProcessStartTime(): number | null | undefined;
}

/**
 * Unix time in ms when the app process started, or null when the process was not started to
 * show the app (prewarm, background launch) or the native module is not linked.
 * The native side gives the value once per process: a JS restart gets null.
 */
export function getProcessStartTime(): number | null {
  const appStartupModule: AppStartupNativeModule | undefined = NativeModules.AppStartupModule;
  return appStartupModule?.getProcessStartTime() ?? null;
}
