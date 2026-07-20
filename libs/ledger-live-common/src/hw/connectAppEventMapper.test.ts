import {
  DeviceActionStatus,
  DeviceManagementKit,
  DeviceModelId,
  DeviceNotOnboardedError,
  DeviceSessionStateType,
  DeviceStatus,
  type DeviceSessionState,
  type ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import type {
  ConnectAppDAError,
  ConnectAppDAIntermediateValue,
  ConnectAppDAOutput,
  ConnectAppDAState,
} from "@ledgerhq/live-dmk-shared";
import { BehaviorSubject, firstValueFrom, Subject } from "rxjs";
import { DeviceNotOnboarded } from "../errors";
import { ConnectAppEventMapper } from "./connectAppEventMapper";

describe("ConnectAppEventMapper", () => {
  it("GIVEN a DMK device-not-onboarded error WHEN mapping the event THEN it emits the legacy error", async () => {
    // GIVEN
    const deviceActionStates = new Subject<ConnectAppDAState>();
    const deviceSessionState = new BehaviorSubject<DeviceSessionState>({
      sessionStateType: DeviceSessionStateType.Connected,
      deviceStatus: DeviceStatus.CONNECTED,
      deviceModelId: DeviceModelId.NANO_X,
    });
    const dmk = {
      getDeviceSessionState: jest.fn(() => deviceSessionState),
    } as unknown as DeviceManagementKit;
    const execution = {
      observable: deviceActionStates.asObservable(),
      cancel: jest.fn(),
    } as ExecuteDeviceActionReturnType<
      ConnectAppDAOutput,
      ConnectAppDAError,
      ConnectAppDAIntermediateValue
    >;
    const mapper = new ConnectAppEventMapper(dmk, "session-id", "Ethereum", execution);
    const mappedEvent = firstValueFrom(mapper.map());

    // WHEN
    deviceActionStates.next({
      status: DeviceActionStatus.Error,
      error: new DeviceNotOnboardedError(),
    });

    // THEN
    await expect(mappedEvent).rejects.toBeInstanceOf(DeviceNotOnboarded);
  });
});
