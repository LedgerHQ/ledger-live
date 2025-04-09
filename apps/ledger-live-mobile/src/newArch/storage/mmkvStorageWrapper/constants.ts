import { Mode } from "react-native-mmkv";

/** Static configuration for MMKV storage */
export const CONFIG_PARAMS = {
  ID: "ledger-live",
  MODE: Mode.SINGLE_PROCESS,
} as const;
