import { of, BehaviorSubject, Observable } from "rxjs";
import {
  DeviceManagementKit,
  DeviceStatus,
  type DeviceSessionState,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { DeviceManagementKitTransport } from "./DeviceManagementKitTransport";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

const device = (id: string): DiscoveredDevice =>
  ({ id, deviceModel: { model: "stax" } }) as unknown as DiscoveredDevice;

describe("DeviceManagementKitTransport.open with a target device", () => {
  let dmk: DeviceManagementKit;

  beforeAll(() => {
    dmk = getDeviceManagementKit();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    activeDeviceSessionSubject.next(null);
    jest.spyOn(dmk, "connect").mockResolvedValue("new-session");
    // A BehaviorSubject rather than `of`: `listenToDisconnect` unsubscribes on
    // complete, which throws if the source completes during `subscribe()`.
    jest
      .spyOn(dmk, "getDeviceSessionState")
      .mockReturnValue(
        new BehaviorSubject({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState),
      );
  });

  afterAll(() => {
    activeDeviceSessionSubject.next(null);
  });

  it("connects the requested device rather than the first discovered one", async () => {
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(of([device("old"), device("new")]));

    await DeviceManagementKitTransport.open({ deviceId: "new" });

    expect(dmk.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        device: expect.objectContaining({ id: "new" }),
      }),
    );
  });

  it("waits for the requested device to be discovered", async () => {
    // The mock server polls, so the device attached a moment ago is missing from
    // the first emission.
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
      new Observable<DiscoveredDevice[]>(subscriber => {
        subscriber.next([device("old")]);
        subscriber.next([device("old"), device("new")]);
      }),
    );

    await DeviceManagementKitTransport.open({ deviceId: "new" });

    expect(dmk.connect).toHaveBeenCalledTimes(1);
    expect(dmk.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        device: expect.objectContaining({ id: "new" }),
      }),
    );
  });

  it("reconnects when the active session belongs to a different device", async () => {
    // The exact shape of the reported bug: a job for "new" was handed the
    // session still bound to "old", and died once "old" was deleted.
    const otherTransport = {
      sessionId: "old-session",
    } as unknown as DeviceManagementKitTransport;
    activeDeviceSessionSubject.next({
      sessionId: "old-session",
      transport: otherTransport,
    });
    jest
      .spyOn(dmk, "listConnectedDevices")
      .mockReturnValue([{ id: "old", sessionId: "old-session" }] as never);
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(of([device("old"), device("new")]));

    const transport = await DeviceManagementKitTransport.open({ deviceId: "new" });

    expect(transport).not.toBe(otherTransport);
    expect(transport.sessionId).toBe("new-session");
    expect(dmk.connect).toHaveBeenCalledWith(
      expect.objectContaining({ device: expect.objectContaining({ id: "new" }) }),
    );
    expect(activeDeviceSessionSubject.value?.sessionId).toBe("new-session");
  });

  it("reuses the active session when it belongs to the requested device", async () => {
    const liveTransport = {
      sessionId: "live-session",
    } as unknown as DeviceManagementKitTransport;
    activeDeviceSessionSubject.next({
      sessionId: "live-session",
      transport: liveTransport,
    });
    jest
      .spyOn(dmk, "listConnectedDevices")
      .mockReturnValue([{ id: "wanted", sessionId: "live-session" }] as never);
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(of([device("wanted")]));

    const transport = await DeviceManagementKitTransport.open({ deviceId: "wanted" });

    expect(transport).toBe(liveTransport);
    expect(dmk.connect).not.toHaveBeenCalled();
  });

  it("still reuses a live session when no device is requested", async () => {
    const liveTransport = {
      sessionId: "live",
    } as unknown as DeviceManagementKitTransport;
    activeDeviceSessionSubject.next({
      sessionId: "live",
      transport: liveTransport,
    });
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(of([device("other")]));

    const transport = await DeviceManagementKitTransport.open();

    expect(transport).toBe(liveTransport);
    expect(dmk.connect).not.toHaveBeenCalled();
  });

  it("identifies each device by its own descriptor", async () => {
    // A shared "" descriptor collapses every device into one entry in the
    // consumer's list, so adding the swapped-in device is a no-op and removing
    // the swapped-out one empties the list.
    const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
      new Observable<DiscoveredDevice[]>(subscriber => {
        subscriber.next([device("old")]);
        subscriber.next([device("old"), device("new")]);
        subscriber.next([device("new")]);
        subscriber.complete();
      }),
    );
    jest.spyOn(dmk, "listenToConnectedDevice").mockReturnValue(new Observable());

    DeviceManagementKitTransport.listen(observer);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(observer.next.mock.calls.map(([event]) => [event.type, event.descriptor])).toEqual([
      ["add", "old"],
      ["add", "new"],
      ["remove", "old"],
    ]);
  });

  it("still connects the first discovered device when no device is requested", async () => {
    jest
      .spyOn(dmk, "listenToAvailableDevices")
      .mockReturnValue(of([device("first"), device("second")]));

    await DeviceManagementKitTransport.open();

    expect(dmk.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        device: expect.objectContaining({ id: "first" }),
      }),
    );
  });
});
