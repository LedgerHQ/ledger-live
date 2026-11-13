import {
  DeviceStatus,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, ReplaySubject } from "rxjs";
import { connectedDevices$ } from "./connectedDevices";

type FakeSession = {
  device: ConnectedDevice;
  state: BehaviorSubject<DeviceSessionState>;
};

const sessionState = (deviceStatus: DeviceStatus) => ({ deviceStatus }) as DeviceSessionState;

/** Same behavior as the DMK session service: `listenToConnectedDevice` replays every session. */
class FakeDmk {
  private readonly sessions = new Map<string, FakeSession>();
  private readonly openedSessions = new ReplaySubject<ConnectedDevice>();

  readonly dmk = {
    listConnectedDevices: () => [...this.sessions.values()].map(({ device }) => device),
    listenToConnectedDevice: () => this.openedSessions.asObservable(),
    getDeviceSessionState: ({ sessionId }: { sessionId: string }) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("DeviceSessionNotFound");
      }
      return session.state.asObservable();
    },
  } as unknown as DeviceManagementKit;

  connect(sessionId: string): ConnectedDevice {
    const device = { id: `device-${sessionId}`, sessionId } as ConnectedDevice;
    this.sessions.set(sessionId, {
      device,
      state: new BehaviorSubject(sessionState(DeviceStatus.CONNECTED)),
    });
    this.openedSessions.next(device);
    return device;
  }

  setStatus(sessionId: string, deviceStatus: DeviceStatus) {
    this.sessions.get(sessionId)?.state.next(sessionState(deviceStatus));
  }

  completeState(sessionId: string) {
    this.sessions.get(sessionId)?.state.complete();
  }

  disconnect(sessionId: string) {
    this.setStatus(sessionId, DeviceStatus.NOT_CONNECTED);
    this.completeState(sessionId);
    this.sessions.delete(sessionId);
  }
}

const subscribe = (fakeDmk: FakeDmk) => {
  const emissions: ConnectedDevice[][] = [];
  const subscription = connectedDevices$(fakeDmk.dmk).subscribe(devices => emissions.push(devices));
  return { emissions, subscription };
};

describe("connectedDevices$", () => {
  it("GIVEN no session, WHEN subscribing, THEN it should emit an empty list", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();

    // WHEN
    const { emissions, subscription } = subscribe(fakeDmk);

    // THEN
    expect(emissions).toEqual([[]]);
    subscription.unsubscribe();
  });

  it("GIVEN sessions opened before subscribing, WHEN subscribing, THEN it should emit them in one list", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();
    const deviceA = fakeDmk.connect("a");
    const deviceB = fakeDmk.connect("b");

    // WHEN
    const { emissions, subscription } = subscribe(fakeDmk);

    // THEN
    expect(emissions).toEqual([[deviceA, deviceB]]);
    subscription.unsubscribe();
  });

  it("GIVEN a session closed before subscribing, WHEN subscribing, THEN it should not list its device", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();
    fakeDmk.connect("closed");
    fakeDmk.disconnect("closed");
    const device = fakeDmk.connect("open");

    // WHEN
    const { emissions, subscription } = subscribe(fakeDmk);

    // THEN
    expect(emissions).toEqual([[device]]);
    subscription.unsubscribe();
  });

  it("GIVEN a subscription, WHEN a new session opens, THEN it should emit the list with its device", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();
    const deviceA = fakeDmk.connect("a");
    const { emissions, subscription } = subscribe(fakeDmk);

    // WHEN
    const deviceB = fakeDmk.connect("b");

    // THEN
    expect(emissions).toEqual([[deviceA], [deviceA, deviceB]]);
    subscription.unsubscribe();
  });

  it("GIVEN a connected device, WHEN its session reports NOT_CONNECTED, THEN it should emit the list without it", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();
    const device = fakeDmk.connect("a");
    const { emissions, subscription } = subscribe(fakeDmk);

    // WHEN
    fakeDmk.disconnect("a");

    // THEN
    expect(emissions).toEqual([[device], []]);
    subscription.unsubscribe();
  });

  it("GIVEN a connected device, WHEN its session state completes, THEN it should emit the list without it", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();
    const device = fakeDmk.connect("a");
    const { emissions, subscription } = subscribe(fakeDmk);

    // WHEN
    fakeDmk.completeState("a");

    // THEN
    expect(emissions).toEqual([[device], []]);
    subscription.unsubscribe();
  });

  it("GIVEN several sessions, WHEN one session changes status and another one disconnects, THEN it should only remove the disconnected device", () => {
    // GIVEN
    const fakeDmk = new FakeDmk();
    const deviceA = fakeDmk.connect("a");
    const { emissions, subscription } = subscribe(fakeDmk);
    const deviceB = fakeDmk.connect("b");
    const deviceC = fakeDmk.connect("c");

    // WHEN
    fakeDmk.setStatus("a", DeviceStatus.LOCKED);
    fakeDmk.disconnect("b");

    // THEN
    expect(emissions).toEqual([
      [deviceA],
      [deviceA, deviceB],
      [deviceA, deviceB, deviceC],
      [deviceA, deviceC],
    ]);
    subscription.unsubscribe();
  });
});
