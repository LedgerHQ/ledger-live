import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceInfo } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { ManagerTab } from "~/const/manager";

export type MyLedgerNavigatorStackParamList = {
  [ScreenName.MyLedgerChooseDevice]:
    | {
        searchQuery?: string;
        tab?: ManagerTab;
        installApp?: string;
        firmwareUpdate?: boolean;
        device?: Device | null;
        appsToRestore?: string[];
        updateModalOpened?: boolean;
      }
    | undefined;
  [ScreenName.MyLedgerDevice]: {
    device: Device;
    deviceInfo: DeviceInfo;
    result: ListAppsResult;
    searchQuery?: string;
    firmwareUpdate?: boolean;
    appsToRestore?: string[];
    updateModalOpened?: boolean;
    tab: ManagerTab;
  };
};
