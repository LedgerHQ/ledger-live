import { NativeModules, Platform } from "react-native";

// Only implemented for iOS. Uses UIAccessibility.isReduceTransparencyEnabled for a reliable value.
const { ReduceTransparencyModule: NativeReduceTransparency } = NativeModules;

interface ReduceTransparencyModuleInterface {
  getReduceTransparencyEnabled(): Promise<boolean>;
}

export const ReduceTransparencyModule: ReduceTransparencyModuleInterface | null =
  Platform.OS === "ios" && NativeReduceTransparency != null ? NativeReduceTransparency : null;
