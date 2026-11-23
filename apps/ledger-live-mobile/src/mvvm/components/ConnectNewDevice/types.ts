import type {
  ConnectNewDeviceUIState,
  ConnectNewDeviceUIStateTypes,
} from "@ledgerhq/live-dmk-mobile";
import type React from "react";
import type { DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import type { StateAnimation } from "./animations";

export type ConnectNewDeviceDelays = {
  /** Time before the "I don't see my device" button shows, in ms. */
  deviceNotFound?: number;
  /** Time the success view shows before `onConnected` is called, in ms. */
  success?: number;
};

export type ConnectNewDeviceProps = {
  /** Called once, after the success view, with everything needed to talk to the device. */
  onConnected: (result: DeviceConnectionResult) => void;
  /**
   * Shows the "I don't see my device" button after the device not found delay, and is called when
   * the user presses it. Without it, the button never shows.
   */
  onDeviceNotFound?: () => void;
  /** Called when the user closes a discovery error or the unknown error. The flow is over. */
  onClose: () => void;
  /** Read on mount only. */
  delays?: ConnectNewDeviceDelays;
};

export type ConnectNewDeviceErrorUIState = Extract<
  ConnectNewDeviceUIState,
  {
    type:
      | typeof ConnectNewDeviceUIStateTypes.DiscoveryError
      | typeof ConnectNewDeviceUIStateTypes.ConnectionError
      | typeof ConnectNewDeviceUIStateTypes.UnknownError;
  }
>;

export type ConnectNewDeviceNonErrorUIState = Exclude<
  ConnectNewDeviceUIState,
  ConnectNewDeviceErrorUIState
>;

export type StateLayoutProps = {
  animation: StateAnimation;
  loopAnimation: boolean;
  title: string;
  description?: string;
  /** The content under the texts, for example the device list. */
  children?: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
};

/** Lays out a state: `StateLayout` on a full screen, `SheetStateLayout` in a bottom sheet. */
export type StateLayoutComponent = React.ComponentType<StateLayoutProps>;

export type ConnectNewDeviceViewProps = {
  state: ConnectNewDeviceUIState;
  /** Shown under the error bottom sheet. */
  lastNonErrorState: ConnectNewDeviceNonErrorUIState;
  platform: Exclude<AppPlatform, "desktop">;
  onDeviceNotFound?: () => void;
  /** Called on every close of the error sheet, also when `state` leaves an error. */
  onCloseErrorSheet: () => void;
};
