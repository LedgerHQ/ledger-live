import { Device } from "@ledgerhq/live-common/hw/actions/types";

export interface ViewProps {
  bannerVisible: boolean;
  lastConnectedDevice: Device | null;
  version: string;
  onClickUpdate(): void;
  unsupportedUpdateDrawerOpened: boolean;
  closeUnsupportedUpdateDrawer(): void;
  isUpdateSupportedButDeviceNotWired: boolean;
}
