export type MaestroPlatform = "ios" | "android";

export type MaestroProjectId = "ios" | "ios.debug" | "android" | "android.debug";

export type MaestroProject = {
  id: MaestroProjectId;
  platform: MaestroPlatform;
  appId: string;
  appPath: string;
  needsMetro: boolean;
};

const androidArch = process.env.CI ? "x86_64" : "arm64-v8a";

export const projects: Record<MaestroProjectId, MaestroProject> = {
  ios: {
    id: "ios",
    platform: "ios",
    appId: "com.ledger.live",
    appPath:
      "../../apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
    needsMetro: false,
  },
  "ios.debug": {
    id: "ios.debug",
    platform: "ios",
    appId: "com.ledger.live.debug",
    appPath:
      "../../apps/ledger-live-mobile/ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app",
    needsMetro: true,
  },
  android: {
    id: "android",
    platform: "android",
    appId: "com.ledger.live.detox",
    appPath: `../../apps/ledger-live-mobile/android/app/build/outputs/apk/detox/app-${androidArch}-detox.apk`,
    needsMetro: false,
  },
  "android.debug": {
    id: "android.debug",
    platform: "android",
    appId: "com.ledger.live.debug",
    appPath: `../../apps/ledger-live-mobile/android/app/build/outputs/apk/debug/app-${androidArch}-debug.apk`,
    needsMetro: true,
  },
};

function isProjectId(id: string | undefined): id is MaestroProjectId {
  return Boolean(id && id in projects);
}

export function getProject(id: string | undefined): MaestroProject {
  if (!isProjectId(id)) {
    throw new Error(
      `Unknown Maestro project "${id}". Use one of: ${Object.keys(projects).join(", ")}`,
    );
  }

  return projects[id];
}
