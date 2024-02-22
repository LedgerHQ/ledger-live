import { lastConnectedDeviceSelector } from "~/reducers/settings";

export interface ViewProps {
  bannerVisible: boolean;
  lastConnectedDevice: ReturnType<typeof lastConnectedDeviceSelector>;
  version: string;
  onClickUpdate: () => void;
  unsupportedUpdateDrawerOpened: boolean;
  closeUnsupportedUpdateDrawer: () => void;
  isUpdateSupportedButDeviceNotWired: boolean;
}
