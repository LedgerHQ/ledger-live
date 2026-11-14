import type { ReactNode } from "react";
import type {
  ConnectKnownOrNewDeviceUIState,
  ConnectKnownOrNewDeviceUIStateTypes,
  DeviceListItem,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import type {
  ConnectNewDeviceDelays,
  ConnectNewDeviceViewProps,
} from "LLM/components/ConnectNewDevice";

export type ConnectKnownOrNewDeviceDelays = {
  /** Time before the waiting drawer shows the hint that opens the Add mode, in ms. */
  deviceNotFound?: number;
  /** The delays of the Add mode. */
  connectNewDevice?: ConnectNewDeviceDelays;
};

export type ConnectKnownOrNewDeviceProps = {
  /**
   * Called each time the user connects a device, also a device that was already connected.
   * `isNewDevice` is `true` when the device was not known before this connection.
   */
  onConnected: (result: DeviceConnectionResult, options: { isNewDevice: boolean }) => void;
  /** Called when the Add mode starts and stops. The caller hides the rest of its screen. */
  onAddModeChange: (isAdding: boolean) => void;
  /** Stops discovery while the caller uses the device. */
  isPaused: boolean;
  /** Called by the "I don't see my device" button of the Add mode, which shows only with it. */
  onDeviceNotFound?: () => void;
  /** Read on mount only. */
  delays?: ConnectKnownOrNewDeviceDelays;
  /** Shown under the device list. */
  children?: ReactNode;
};

export type ConnectKnownOrNewDeviceErrorUIState = Extract<
  ConnectKnownOrNewDeviceUIState,
  {
    type:
      | typeof ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError
      | typeof ConnectKnownOrNewDeviceUIStateTypes.ConnectionError
      | typeof ConnectKnownOrNewDeviceUIStateTypes.UnknownError;
  }
>;

export type ConnectKnownOrNewDeviceViewProps = {
  state: ConnectKnownOrNewDeviceUIState;
  /** The rows of the last state with a device list, shown while a state without one shows. */
  devices: Array<DeviceListItem>;
  /** Shown under the error sheet of the Add mode. */
  addModeLastNonErrorState: ConnectNewDeviceViewProps["lastNonErrorState"];
  platform: Exclude<AppPlatform, "desktop">;
  onDeviceNotFound?: () => void;
  /** Called on every close of the error sheet, also when `state` leaves an error. */
  onCloseErrorSheet: () => void;
  /** Called on every close of the error sheet of the Add mode. */
  onCloseAddModeErrorSheet: () => void;
  children?: ReactNode;
};
