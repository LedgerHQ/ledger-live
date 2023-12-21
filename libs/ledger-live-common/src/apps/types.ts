import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { DeviceModel, DeviceModelId } from "@ledgerhq/devices";
import { App, DeviceInfo, FinalFirmware, Language, LanguagePackage } from "@ledgerhq/types-live";
import type { Observable, Subject } from "rxjs";
export type Exec = (
  appOp: AppOp,
  targetId: string | number,
  app: App,
) => Observable<{
  progress: number;
}>;
export type InstalledItem = {
  name: string;
  updated: boolean;
  hash: string;
  blocks: number;
  version: string;
  availableVersion: string;
};
export type ListAppsEvent =
  | {
      type: "device-permission-requested";
    }
  | {
      type: "device-permission-granted";
    }
  | {
      type: "result";
      result: ListAppsResult;
    }
  | {
      type: "allow-manager-requested";
    };
export type InlineAppInstallEvent =
  | {
      type: "device-permission-requested";
    }
  | {
      type: "listing-apps";
    }
  | {
      type: "listed-apps";
      installQueue: string[];
    }
  | {
      type: "device-permission-granted";
    }
  | {
      type: "app-not-installed";
      appName: string;
      appNames: string[];
    }
  | {
      type: "some-apps-skipped";
      skippedAppOps: SkippedAppOp[];
    }
  | {
      type: "inline-install";
      progress: number;
      itemProgress: number;
      currentAppOp: AppOp;
      installQueue: string[];
    };

export type ListAppResponse = Array<{
  name: string;
  hash: string;
  hash_code_data: string; // To match HSM response.
  blocks?: number;
  flags?: number;
}>;

export type ListAppsResult = {
  appByName: Record<string, App>;
  appsListNames: string[];
  installedAvailable: boolean;
  installed: InstalledItem[];
  installedLanguagePack: LanguagePackage | undefined;
  deviceInfo: DeviceInfo;
  deviceModelId: DeviceModelId;
  deviceName: string;
  firmware: FinalFirmware | null | undefined;
  customImageBlocks: number;
};
export type State = {
  deviceInfo: DeviceInfo;
  deviceModel: DeviceModel;
  firmware: FinalFirmware | null | undefined;
  appByName: Record<string, App>;
  apps: App[];
  customImageBlocks: number;
  installedAvailable: boolean;
  installed: InstalledItem[];
  installedLanguagePack: LanguagePackage | undefined;
  recentlyInstalledApps: string[];
  installQueue: string[];
  uninstallQueue: string[];
  skippedAppOps: SkippedAppOp[]; // Nb If an AppOp couldn't be completed, track why.
  updateAllQueue: string[]; // queue saved at the time of a "updateAll" action
  currentAppOp: AppOp | null | undefined;
  currentProgressSubject: Subject<number> | null | undefined;
  currentError:
    | {
        error: Error;
        appOp: AppOp;
      }
    | null
    | undefined;
};
export type AppOp =
  | {
      type: "install";
      name: string;
    }
  | {
      type: "uninstall";
      name: string;
    };

export enum SkipReason {
  NoSuchAppOnProvider,
  AppAlreadyInstalled,
  NotEnoughSpace,
}

export type SkippedAppOp = {
  reason: SkipReason;
  appOp: AppOp;
};

export type Action = // recover from an error

    | {
        type: "reset";
        initialState: State;
      }
    | {
        type: "recover";
      } // wipe will remove all apps of the device
    | {
        type: "wipe";
      } // uninstall a specific app by name
    | {
        type: "uninstall";
        name: string;
        force?: boolean;
      } // install or update a specific app by name
    | {
        type: "install";
        name: string;
        allowPartialDependencies?: boolean;
      } // update all
    | {
        type: "updateAll";
      } // action to run after an update was done on the device (uninstall/install)
    | {
        type: "setCustomImage";
        lastSeenCustomImage: {
          hash: string;
          size: number;
        };
      } // action to run after a successful custom image flow, to update the UI accordingly
    | {
        type: "onRunnerEvent";
        event: RunnerEvent;
      }
    | {
        type: "wiped";
      };
export type RunnerEvent =
  | {
      type: "runStart";
      appOp: AppOp;
    }
  | {
      type: "runProgress";
      appOp: AppOp;
      progress: number;
    }
  | {
      type: "runError";
      appOp: AppOp;
      error: Error;
    }
  | {
      type: "runSuccess";
      appOp: AppOp;
    };

export type AppData = {
  currency: CryptoCurrency | null | undefined;
  name: string;
  blocks: number;
  bytes: number;
};
export type UnrecognizedAppData = {
  name: string;
  hash: string;
};
export type AppsDistribution = {
  totalBlocks: number;
  totalBytes: number;
  osBlocks: number;
  osBytes: number;
  apps: Array<AppData>;
  appsSpaceBlocks: number;
  appsSpaceBytes: number;
  totalAppsBlocks: number;
  totalAppsBytes: number;
  freeSpaceBlocks: number;
  freeSpaceBytes: number;
  shouldWarnMemory: boolean;
  customImageBlocks: number;
  languagePackBlocks: number;
};
