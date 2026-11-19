import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceInfo } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { ManagerTab } from "~/const/manager";

export type MyLedgerNavigatorStackParamList = {
  [ScreenName.MyLedgerDevice]: {
    device: Device;
    deviceInfo: DeviceInfo;
    result: ListAppsResult;
    searchQuery?: string;
    appsToRestore?: string[];
    updateModalOpened?: boolean;
    firmwareUpdate?: boolean;
    tab: ManagerTab;
  };
};
