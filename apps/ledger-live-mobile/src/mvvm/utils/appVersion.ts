import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";

export const appVersion = process.env.DETOX_APP_VERSION ?? nativeApplicationVersion ?? "";
export const buildVersion = nativeBuildVersion ?? "";
