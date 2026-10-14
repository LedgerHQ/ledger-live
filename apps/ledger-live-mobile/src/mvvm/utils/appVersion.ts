import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";

export const appVersion = nativeApplicationVersion ?? "";
export const buildVersion = nativeBuildVersion ?? "";
