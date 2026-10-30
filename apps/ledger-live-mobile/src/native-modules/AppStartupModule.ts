import { NativeModules } from "react-native";

const { AppStartupModule } = NativeModules;

interface AppStartupModuleInterface {
  /** Unix time in ms, or null when the process was not started to show the app. */
  getProcessStartTime(): number | null;
}

export default AppStartupModule as AppStartupModuleInterface | undefined;
