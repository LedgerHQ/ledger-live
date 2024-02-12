import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { ManagerTab } from "~/const/manager";
import type { FirmwareUpdateProps } from "../../../screens/FirmwareUpdate";

export type ManagerNavigatorStackParamList = {
  [ScreenName.Manager]:
    | {
        searchQuery?: string;
        tab?: ManagerTab;
        installApp?: string;
        firmwareUpdate?: boolean;
        device?: Device | null;
        appsToRestore?: string[];
      }
    | undefined;
  [ScreenName.ManagerMain]: {
    device: Device;
    deviceInfo: DeviceInfo;
    result: ListAppsResult;
    searchQuery?: string;
    firmwareUpdate?: boolean;
    appsToRestore?: string[];
    updateModalOpened?: boolean;
    tab: ManagerTab;
  };
  [ScreenName.FirmwareUpdate]: {
    deviceInfo?: DeviceInfo | null;
    firmwareUpdateContext?: FirmwareUpdateContext | null;
    device?: Device | null;
    onBackFromUpdate: FirmwareUpdateProps["onBackFromUpdate"];
    isBeforeOnboarding?: boolean;
  };
};
