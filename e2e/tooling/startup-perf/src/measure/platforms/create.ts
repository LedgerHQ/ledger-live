import type { PlatformName } from "../../types.ts";
import type { Platform } from "../types.ts";
import { createAndroid } from "./android.ts";
import { createIos } from "./ios.ts";

// The app's ids: the release's, and its variants' (android/app/build.gradle's applicationIdSuffix,
// the iOS targets' PRODUCT_BUNDLE_IDENTIFIER).
export const APP_IDS = [
  "com.ledger.live",
  "com.ledger.live.debug",
  "com.ledger.live.staging",
  "com.ledger.live.detox",
  "com.ledger.live.nightly",
  "com.ledger.live.prerelease",
];

/** One of the app's ids, as written above: never an option of adb or simctl. */
export function knownAppId(appId: string): string {
  const known = APP_IDS.find(id => id === appId);
  if (!known) throw new Error(`--app-id must be one of the app's ids: ${APP_IDS.join(", ")}`);
  return known;
}

export function createPlatform(name: PlatformName, { appId }: { appId: string }): Platform {
  const id = knownAppId(appId);
  return name === "android" ? createAndroid({ appId: id }) : createIos({ appId: id });
}
