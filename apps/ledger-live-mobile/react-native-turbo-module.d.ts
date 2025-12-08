// Shim for Braze SDK v18: map legacy internal TurboModule import to the public React Native type
declare module "react-native/Libraries/TurboModule/RCTExport" {
  export type { TurboModule } from "react-native";
}
