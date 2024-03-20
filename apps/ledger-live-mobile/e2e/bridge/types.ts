import { Event as AppEvent } from "@ledgerhq/live-common/hw/actions/app";
import { DescriptorEventType } from "@ledgerhq/hw-transport";
import { AccountRaw } from "@ledgerhq/types-live";
import { BleState, SettingsState } from "~/reducers/types";
import { DeviceUSB } from "../models/devices";
import { Subject, Observable } from "rxjs";

import { ConnectAppEvent } from "@ledgerhq/live-common/hw/connectApp";
import { ConnectManagerEvent } from "@ledgerhq/live-common/hw/connectManager";
import { InstallLanguageEvent } from "@ledgerhq/live-common/hw/installLanguage";
import { LoadImageEvent } from "@ledgerhq/live-common/hw/staxLoadImage";
import { SwapRequestEvent } from "@ledgerhq/live-common/exchange/swap/types";
import { FetchImageEvent } from "@ledgerhq/live-common/hw/staxFetchImage";
import { ExchangeRequestEvent } from "@ledgerhq/live-common/hw/actions/startExchange";
import { CompleteExchangeRequestEvent } from "@ledgerhq/live-common/exchange/platform/types";
import { RemoveImageEvent } from "@ledgerhq/live-common/hw/staxRemoveImage";
import { RenameDeviceEvent } from "@ledgerhq/live-common/hw/renameDevice";

export type ServerData =
  | {
      type: "walletAPIResponse";
      payload: Record<string, unknown>;
    }
  | {
      type: "appLogs";
      fileName: string;
      payload: string;
    }
  | { type: "ACK"; id: string };

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
  | { type: "getLogs"; id: string; fileName: string }
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
  | { type: "setGlobals"; id: string; payload: { [key: string]: unknown } }
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

// these adaptor will filter the event type to satisfy typescript (workaround), it works because underlying exec usage will ignore unknown event type
export const connectAppExecMock = (): Observable<ConnectAppEvent> =>
  mockDeviceEventSubject as Observable<ConnectAppEvent>;
export const initSwapExecMock = (): Observable<SwapRequestEvent> =>
  mockDeviceEventSubject as Observable<SwapRequestEvent>;
export const startExchangeExecMock = (): Observable<ExchangeRequestEvent> =>
  mockDeviceEventSubject as Observable<ExchangeRequestEvent>;
export const connectManagerExecMock = (): Observable<ConnectManagerEvent> =>
  mockDeviceEventSubject as Observable<ConnectManagerEvent>;
export const staxFetchImageExecMock = (): Observable<FetchImageEvent> =>
  mockDeviceEventSubject as Observable<FetchImageEvent>;
export const staxLoadImageExecMock = (): Observable<LoadImageEvent> =>
  mockDeviceEventSubject as Observable<LoadImageEvent>;
export const staxRemoveImageExecMock = (): Observable<RemoveImageEvent> =>
  mockDeviceEventSubject as Observable<RemoveImageEvent>;
export const installLanguageExecMock = (): Observable<InstallLanguageEvent> =>
  mockDeviceEventSubject as Observable<InstallLanguageEvent>;
export const completeExchangeExecMock = (): Observable<CompleteExchangeRequestEvent> =>
  mockDeviceEventSubject as Observable<CompleteExchangeRequestEvent>;
export const renameDeviceExecMock = (): Observable<RenameDeviceEvent> =>
  mockDeviceEventSubject as Observable<RenameDeviceEvent>;
