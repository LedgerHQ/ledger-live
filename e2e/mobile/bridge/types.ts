import { Event as AppEvent } from "@ledgerhq/live-common/hw/actions/app";
import { DescriptorEventType } from "@ledgerhq/hw-transport";
import { AccountRaw } from "@ledgerhq/types-live";
import { BleState, SettingsState } from "~/reducers/types";
import { Subject } from "rxjs";

import { ConnectAppEvent } from "@ledgerhq/live-common/hw/connectApp";
import { ConnectManagerEvent } from "@ledgerhq/live-common/hw/connectManager";
import { InstallLanguageEvent } from "@ledgerhq/live-common/hw/installLanguage";
import { LoadImageEvent } from "@ledgerhq/live-common/hw/customLockScreenLoad";
import { SwapRequestEvent } from "@ledgerhq/live-common/exchange/swap/types";
import { FetchImageEvent } from "@ledgerhq/live-common/hw/customLockScreenFetch";
import { ExchangeRequestEvent } from "@ledgerhq/live-common/hw/actions/startExchange";
import { CompleteExchangeRequestEvent } from "@ledgerhq/live-common/exchange/platform/types";
import { RemoveImageEvent } from "@ledgerhq/live-common/hw/customLockScreenRemove";
import { RenameDeviceEvent } from "@ledgerhq/live-common/hw/renameDevice";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";
import { DeviceUSB } from "../models/devices";

export type ServerData =
  | {
      type: "walletAPIResponse";
      payload: Record<string, unknown>;
    }
  | {
      type: "appLogs";
      payload: string;
    }
  | {
      type: "appFlags";
      payload: string;
    }
  | {
      type: "appEnvs";
      payload: string;
    }
  | { type: "ACK"; id: string }
  | { type: "swapLiveAppReady" };

export type MessageData =
  | {
      type: DescriptorEventType;
      id: string;
      payload: { id: string; name: string; serviceUUID: string };
    }
  | { type: "open"; id: string }
  | { type: "mockDeviceEvent"; id: string; payload: MockDeviceEvent[] }
  | { type: "acceptTerms"; id: string }
  | { type: "addUSB"; id: string; payload: DeviceUSB }
  | { type: "addKnownSpeculos"; id: string; payload: string }
  | { type: "removeKnownSpeculos"; id: string; payload: string }
  | { type: "getLogs"; id: string }
  | { type: "getFlags"; id: string }
  | { type: "getEnvs"; id: string }
  | { type: "navigate"; id: string; payload: string }
  | { type: "importSettings"; id: string; payload: Partial<SettingsState> }
  | {
      type: "importAccounts";
      id: string;
      payload: {
        data: AccountRaw;
        version: number;
      }[];
    }
  | { type: "importBle"; id: string; payload: BleState }
  | { type: "overrideFeatureFlags"; id: string; payload: SettingsSetOverriddenFeatureFlagsPlayload }
  | { type: "setGlobals"; id: string; payload: { [key: string]: unknown } }
  | { type: "swapSetup"; id: string }
  | { type: "waitSwapReady"; id: string }
  | { type: "ACK"; id: string };

export type MockDeviceEvent =
  | ConnectAppEvent
  | AppEvent
  | ConnectManagerEvent
  | InstallLanguageEvent
  | LoadImageEvent
  | FetchImageEvent
  | ExchangeRequestEvent
  | SwapRequestEvent
  | RemoveImageEvent
  | RenameDeviceEvent
  | CompleteExchangeRequestEvent
  | { type: "complete" };

export const mockDeviceEventSubject = new Subject<MockDeviceEvent>();
