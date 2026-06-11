import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import type {
  AppRequest,
  AppResult,
  AppState,
  Event as AppActionEvent,
} from "@ledgerhq/live-common/hw/actions/app";
import type { Action } from "@ledgerhq/live-common/hw/actions/types";
import type {
  ConnectAppEvent,
  Input as ConnectAppInput,
} from "@ledgerhq/live-common/hw/connectApp";
import { ReplaySubject, type Observable } from "rxjs";
import { act } from "tests/testSetup";

type ListingAppsEvent = Extract<AppActionEvent, { type: "listing-apps" }>;
type ListedAppsEvent = Extract<AppActionEvent, { type: "listed-apps" }>;
type InlineInstallEvent = Extract<AppActionEvent, { type: "inline-install" }>;
type SomeAppsSkippedEvent = Extract<AppActionEvent, { type: "some-apps-skipped" }>;
type OpenedEvent = Extract<AppActionEvent, { type: "opened" }>;
type DevicePermissionRequestedEvent = Extract<
  AppActionEvent,
  { type: "device-permission-requested" }
>;
type DevicePermissionGrantedEvent = Extract<AppActionEvent, { type: "device-permission-granted" }>;
type ErrorEvent = Extract<AppActionEvent, { type: "error" }>;

type ConnectAppMockEvent =
  | ListingAppsEvent
  | ListedAppsEvent
  | InlineInstallEvent
  | SomeAppsSkippedEvent
  | OpenedEvent
  | DevicePermissionRequestedEvent
  | DevicePermissionGrantedEvent
  | ErrorEvent;

type InlineInstallParams = Omit<InlineInstallEvent, "type" | "itemProgress"> & {
  itemProgress?: InlineInstallEvent["itemProgress"];
};

type ConnectAppMockEvents = {
  listingApps: () => Promise<void>;
  listedApps: (installQueue: ListedAppsEvent["installQueue"]) => Promise<void>;
  inlineInstall: (params: InlineInstallParams) => Promise<void>;
  someAppsSkipped: (skippedAppOps: SomeAppsSkippedEvent["skippedAppOps"]) => Promise<void>;
  opened: (params?: Omit<OpenedEvent, "type">) => Promise<void>;
  devicePermissionRequested: () => Promise<void>;
  devicePermissionGranted: () => Promise<void>;
};

type ConnectAppMockEventPushers = {
  listingApps: () => void;
  listedApps: (installQueue: ListedAppsEvent["installQueue"]) => void;
  inlineInstall: (params: InlineInstallParams) => void;
  someAppsSkipped: (skippedAppOps: SomeAppsSkippedEvent["skippedAppOps"]) => void;
  opened: (params?: Omit<OpenedEvent, "type">) => void;
  devicePermissionRequested: () => void;
  devicePermissionGranted: () => void;
};

export type ConnectAppMock = {
  action: Action<AppRequest, AppState, AppResult>;
  push: (event: ConnectAppMockEvent) => Promise<void>;
  error: (error: Error) => Promise<void>;
  complete: () => Promise<void>;
  reset: () => void;
  emit: (run: (events: ConnectAppMockEventPushers) => void | Promise<void>) => Promise<void>;
  events: ConnectAppMockEvents;
};

export function createConnectAppMock(): ConnectAppMock {
  let subject = new ReplaySubject<ConnectAppMockEvent>(20);

  const runInAct = async (callback: () => void | Promise<void>) => {
    await act(async () => {
      await callback();
    });
  };

  const pushEvent = (event: ConnectAppMockEvent) => {
    subject.next(event);
  };

  const push = async (event: ConnectAppMockEvent) => {
    await runInAct(() => {
      pushEvent(event);
    });
  };

  const error = async (nextError: Error) => {
    await push({ type: "error", error: nextError });
  };

  const complete = async () => {
    await runInAct(() => {
      subject.complete();
    });
  };

  const reset = () => {
    subject.complete();
    subject = new ReplaySubject<ConnectAppMockEvent>(20);
  };

  const pushers: ConnectAppMockEventPushers = {
    listingApps: () => pushEvent({ type: "listing-apps" }),
    listedApps: installQueue => pushEvent({ type: "listed-apps", installQueue }),
    inlineInstall: ({
      progress,
      currentAppOp,
      installQueue,
      itemProgress = 0,
    }: InlineInstallParams) =>
      pushEvent({
        type: "inline-install",
        progress,
        itemProgress,
        currentAppOp,
        installQueue,
      }),
    someAppsSkipped: skippedAppOps => pushEvent({ type: "some-apps-skipped", skippedAppOps }),
    opened: params => pushEvent({ type: "opened", ...params }),
    devicePermissionRequested: () => pushEvent({ type: "device-permission-requested" }),
    devicePermissionGranted: () => pushEvent({ type: "device-permission-granted" }),
  };

  const events: ConnectAppMockEvents = {
    listingApps: () => runInAct(() => pushers.listingApps()),
    listedApps: installQueue => runInAct(() => pushers.listedApps(installQueue)),
    inlineInstall: params => runInAct(() => pushers.inlineInstall(params)),
    someAppsSkipped: skippedAppOps => runInAct(() => pushers.someAppsSkipped(skippedAppOps)),
    opened: params => runInAct(() => pushers.opened(params)),
    devicePermissionRequested: () => runInAct(() => pushers.devicePermissionRequested()),
    devicePermissionGranted: () => runInAct(() => pushers.devicePermissionGranted()),
  };

  return {
    action: createAction(
      (_input: ConnectAppInput) => subject as unknown as Observable<ConnectAppEvent>,
    ),
    push,
    error,
    complete,
    reset,
    emit: async run => {
      await runInAct(async () => {
        await run(pushers);
      });
    },
    events,
  };
}
