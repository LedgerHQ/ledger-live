import type { ConnectAppEvent } from "@ledgerhq/live-common/hw/connectApp";
import type { ConnectManagerEvent } from "@ledgerhq/live-common/hw/connectManager";
import type { InstallLanguageEvent } from "@ledgerhq/live-common/hw/installLanguage";
import type { LoadImageEvent } from "@ledgerhq/live-common/hw/customLockScreenLoad";
import type { FetchImageEvent } from "@ledgerhq/live-common/hw/customLockScreenFetch";
import type { ExchangeRequestEvent } from "@ledgerhq/live-common/hw/actions/startExchange";
import type { CompleteExchangeRequestEvent } from "@ledgerhq/live-common/exchange/platform/types";
import type { RemoveImageEvent } from "@ledgerhq/live-common/hw/customLockScreenRemove";
import type { RenameDeviceEvent } from "@ledgerhq/live-common/hw/renameDevice";
import type {
  MessageData as BridgeMessageData,
  MockDeviceEvent,
} from "@ledgerhq/live-e2e-shared/bridge/types";
import { Subject, type Observable } from "rxjs";
import type { PayCardPersistedState } from "~/db";
import type { BleState, SettingsState } from "~/reducers/types";

export type { ServerData } from "@ledgerhq/live-e2e-shared/bridge/types";

export type MessageData = BridgeMessageData<{
  settings: Partial<SettingsState>;
  ble: BleState;
  payCard: Partial<PayCardPersistedState>;
}>;

export const mockDeviceEventSubject = new Subject<MockDeviceEvent>();

/* eslint-disable @typescript-eslint/consistent-type-assertions */
// these adaptor will filter the event type to satisfy typescript (workaround), it works because underlying exec usage will ignore unknown event type
export const connectAppExecMock = (): Observable<ConnectAppEvent> =>
  mockDeviceEventSubject as Observable<ConnectAppEvent>;
export const startExchangeExecMock = (): Observable<ExchangeRequestEvent> =>
  mockDeviceEventSubject as Observable<ExchangeRequestEvent>;
export const connectManagerExecMock = (): Observable<ConnectManagerEvent> =>
  mockDeviceEventSubject as Observable<ConnectManagerEvent>;
export const fetchImageExecMock = (): Observable<FetchImageEvent> =>
  mockDeviceEventSubject as Observable<FetchImageEvent>;
export const loadImageExecMock = (): Observable<LoadImageEvent> =>
  mockDeviceEventSubject as Observable<LoadImageEvent>;
export const removeImageExecMock = (): Observable<RemoveImageEvent> =>
  mockDeviceEventSubject as Observable<RemoveImageEvent>;
export const installLanguageExecMock = (): Observable<InstallLanguageEvent> =>
  mockDeviceEventSubject as Observable<InstallLanguageEvent>;
export const completeExchangeExecMock = (): Observable<CompleteExchangeRequestEvent> =>
  mockDeviceEventSubject as Observable<CompleteExchangeRequestEvent>;
export const renameDeviceExecMock = (): Observable<RenameDeviceEvent> =>
  mockDeviceEventSubject as Observable<RenameDeviceEvent>;
/* eslint-enable @typescript-eslint/consistent-type-assertions */
