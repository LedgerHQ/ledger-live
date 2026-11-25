import type { ReactNode } from "react";
import type {
  ConnectKnownOrNewDeviceUIState,
  ConnectKnownOrNewDeviceUIStateTypes,
  DeviceListItem,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult, SourceFlow } from "@ledgerhq/live-dmk-shared";
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
   * The flow that shows the component. The component adds it to all its analytics events, also to
   * the events of the Add mode.
   */
  sourceFlow: SourceFlow;
  /** Called each time the user connects a device, also a device that was already connected. */
  onConnected: (result: DeviceConnectionResult) => void;
  /** Called when the Add mode starts and stops. The caller hides the rest of its screen. */
  onAddModeChange: (isAdding: boolean) => void;
  /** Stops discovery while the caller uses the device. */
  isPaused: boolean;
  /** Called by the "I don't see my device" button of the Add mode, which shows only with it. */
  onDeviceNotFound?: () => void;
  /** Replaces the Add mode: the Add buttons call it instead. `hasDevices` is `false` with an empty list. */
  onAddDevice?: (hasDevices: boolean) => void;
  /** Read on mount only. */
  delays?: ConnectKnownOrNewDeviceDelays;
  /** Shown right under the device list, only when the list has devices. */
  listFooter?: ReactNode;
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
  listFooter?: ReactNode;
  children?: ReactNode;
};
