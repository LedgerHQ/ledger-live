import { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DebugOsUpdateBannerMode } from "~/reducers/types";

export interface ViewProps {
  bannerVisible: boolean;
  lastConnectedDevice: Device | null;
  version: string;
  onClickUpdate(): void;
  unsupportedUpdateDrawerOpened: boolean;
  closeUnsupportedUpdateDrawer(): void;
  isUpdateSupportedButDeviceNotWired: boolean;
  shouldDisplayWallet40MainNav: boolean;
  isInMyLedgerDeviceScreen: boolean;
  debugBannerMode: DebugOsUpdateBannerMode;
}

export type DrawerProps = Pick<
  ViewProps,
  | "unsupportedUpdateDrawerOpened"
  | "closeUnsupportedUpdateDrawer"
  | "isUpdateSupportedButDeviceNotWired"
> & {
  productName: string | undefined;
  noCloseButton?: boolean;
};
