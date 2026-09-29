import { Subject } from "rxjs";
import {
  DeviceActionStatus,
  DeviceSessionStateType,
  UserInteractionRequired,
  type DeviceActionState,
  type DeviceManagementKit,
  type DeviceSessionState,
  type ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import type {
  ConnectAppDAError,
  ConnectAppDAIntermediateValue,
  ConnectAppDAOutput,
} from "@ledgerhq/live-dmk-shared";
import { ConnectAppEventMapper } from "./connectAppEventMapper";
import type { ConnectAppEvent } from "./connectApp";

const ethereum = { versionName: "Ethereum", version: "1.15.2" };
const exchange = { versionName: "Exchange", version: "4.4.4" };

function createMapper() {
  const actionEvents = new Subject<
    DeviceActionState<ConnectAppDAOutput, ConnectAppDAError, ConnectAppDAIntermediateValue>
  >();
  const deviceState = new Subject<DeviceSessionState>();
  const dmk = {
    getDeviceSessionState: () => deviceState.asObservable(),
  } as unknown as DeviceManagementKit;
  const events = {
    observable: actionEvents.asObservable(),
    cancel: () => undefined,
  } as ExecuteDeviceActionReturnType<
    ConnectAppDAOutput,
    ConnectAppDAError,
    ConnectAppDAIntermediateValue
  >;
  const received: ConnectAppEvent[] = [];
  const subscription = new ConnectAppEventMapper(dmk, "session", "Exchange", events)
    .map()
    .subscribe(event => {
      received.push(event);
    });

  return { actionEvents, deviceState, received, subscription };
}

describe("ConnectAppEventMapper", () => {
  it("should emit installed app versions from device metadata before the app is opened", () => {
    const { actionEvents, deviceState, received, subscription } = createMapper();
    deviceState.next({
      sessionStateType: DeviceSessionStateType.ReadyWithSecureChannel,
      currentApp: { name: "Exchange", version: "4.4.4" },
    } as DeviceSessionState);

    actionEvents.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        requiredUserInteraction: UserInteractionRequired.None,
        installPlan: null,
        deviceDeprecation: undefined,
        deviceMetadata: {
          applications: [ethereum, exchange],
        } as ConnectAppDAIntermediateValue["deviceMetadata"],
      },
    });
    actionEvents.next({
      status: DeviceActionStatus.Completed,
      output: {
        deviceMetadata: {
          applications: [ethereum, exchange],
        } as ConnectAppDAOutput["deviceMetadata"],
      },
    });

    expect(received).toEqual([
      {
        type: "installed-app-versions",
        apps: [
          { name: "Ethereum", version: "1.15.2" },
          { name: "Exchange", version: "4.4.4" },
        ],
      },
      {
        type: "opened",
        app: { name: "Exchange", version: "4.4.4", flags: 0 },
        derivation: undefined,
      },
    ]);
    subscription.unsubscribe();
  });

  it("should refresh installed app versions after installing a dependency", () => {
    const { actionEvents, deviceState, received, subscription } = createMapper();
    deviceState.next({
      sessionStateType: DeviceSessionStateType.ReadyWithSecureChannel,
      currentApp: { name: "Exchange", version: "4.4.4" },
    } as DeviceSessionState);

    actionEvents.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        requiredUserInteraction: UserInteractionRequired.None,
        installPlan: null,
        deviceDeprecation: undefined,
        deviceMetadata: {
          applications: [exchange],
        } as ConnectAppDAIntermediateValue["deviceMetadata"],
      },
    });
    actionEvents.next({
      status: DeviceActionStatus.Completed,
      output: {
        deviceMetadata: {
          applications: [exchange],
        } as ConnectAppDAOutput["deviceMetadata"],
        installResult: {
          successfullyInstalled: [ethereum],
          alreadyInstalled: [],
          missingApplications: [],
        } as unknown as ConnectAppDAOutput["installResult"],
      },
    });

    expect(received).toEqual([
      {
        type: "installed-app-versions",
        apps: [{ name: "Exchange", version: "4.4.4" }],
      },
      {
        type: "installed-app-versions",
        apps: [
          { name: "Exchange", version: "4.4.4" },
          { name: "Ethereum", version: "1.15.2" },
        ],
      },
      {
        type: "opened",
        app: { name: "Exchange", version: "4.4.4", flags: 0 },
        derivation: undefined,
      },
    ]);
    subscription.unsubscribe();
  });
});
