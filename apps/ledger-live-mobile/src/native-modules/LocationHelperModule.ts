import { NativeModules } from "react-native";

// Only implemented for Android
// See android/app/src/main/java/com/ledger/live/LocationHelperModule.kt
const { LocationHelperModule } = NativeModules;

// To keep up-to-date with the native module Companion object/constants (for Android)
export type CheckAndRequestResponse =
  | "SUCCESS_LOCATION_ALREADY_ENABLED"
  | "SUCCESS_LOCATION_ENABLED"
  | "ERROR_ACTIVITY_DOES_NOT_EXIST"
  | "ERROR_USER_DENIED_LOCATION"
  | "ERROR_LOCATION_PERMISSIONS_NEEDED"
  | "ERROR_UNKNOWN";

// Type of the native module methods
// To keep up-to-date with the native module methods
interface LocationHelperInterface {
  checkAndRequestEnablingLocationServices(): Promise<CheckAndRequestResponse>;
}

export default LocationHelperModule as LocationHelperInterface;
