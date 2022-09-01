import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceInfo } from "@ledgerhq/types-live";
import { StackScreenProps } from "@react-navigation/stack";
import { ScreenName } from "../../../const";
import { ManagerTab } from "../../../const/manager";

export type ManagerNavigatorStackParamList = {
  [ScreenName.Manager]:
    | {
        searchQuery?: string;
        tab?: ManagerTab;
        installApp?: string;
        firmwareUpdate?: boolean;
        device?: Device;
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
};

export type ManagerNavigatorStackProps<
  T extends keyof ManagerNavigatorStackParamList = keyof ManagerNavigatorStackParamList,
> = StackScreenProps<ManagerNavigatorStackParamList, T>;
