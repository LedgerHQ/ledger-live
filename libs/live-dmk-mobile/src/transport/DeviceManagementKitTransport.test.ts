import { BlePlxManager } from "./BlePlxManager";
import { DeviceManagementKitTransport, tracer } from "./DeviceManagementKitTransport";
import { Observable, Subject, Subscription } from "rxjs";
import { State } from "react-native-ble-plx";
import { afterEach, beforeEach, expect } from "vitest";
import { getDeviceManagementKit } from "../hooks";
import {
  ConnectedDevice,
  DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import type { Subscription as TransportSubscription } from "@ledgerhq/hw-transport";

describe("DeviceManagementKitTransport", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("setLogLevel", () => {
    it("should trace not implemented", () => {
      // given
      const transport = DeviceManagementKitTransport;
      // when
      vi.spyOn(tracer, "trace");
      transport.setLogLevel("TEST");
      // then
      expect(tracer.trace).toHaveBeenCalledWith("setLogLevel not implemented", { level: "TEST" });
    });
  });

  describe("observeState", () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should emit available", () => {
      // given
      const observer = new Subject<{ type: string; available: boolean }>();
      vi.spyOn(observer, "next");
      vi.spyOn(BlePlxManager.instance, "onStateChange").mockImplementation(callback => {
        callback(State.PoweredOn);
        return {
          remove: () => null,
        };
      });
      const transport = DeviceManagementKitTransport;
      // when
      transport.observeState(observer);
      // then
      expect(observer.next).toHaveBeenCalledWith({ type: "PoweredOn", available: true });
    });

    it("should not emit available", () => {
      // given
      const observer = new Subject<{ type: string; available: boolean }>();
      vi.spyOn(observer, "next");
      vi.spyOn(BlePlxManager.instance, "onStateChange").mockImplementation(callback => {
        callback(State.PoweredOff);
        return {
          remove: () => null,
        };
      });
      const transport = DeviceManagementKitTransport;
      // when
      transport.observeState(observer);
      // then
      expect(observer.next).toHaveBeenCalledWith({ type: "PoweredOff", available: false });
    });
    it("should call remove on unsubscribe", () => {
      // given
      const observer = new Subject<{ type: string; available: boolean }>();
      const rmBleObs = vi.fn();
      vi.spyOn(observer, "next");
      vi.spyOn(BlePlxManager.instance, "onStateChange").mockImplementation(callback => {
        callback(State.PoweredOff);
        return {
          remove: rmBleObs,
        };
      });
      const transport = DeviceManagementKitTransport;

      // when
      const sub = transport.observeState(observer);
      sub.unsubscribe();

      // then
      expect(rmBleObs).toHaveBeenCalled();
    });
  });

  describe("disconnectDevice", () => {
    afterEach(() => {
      vi.clearAllMocks();
    });
    it("should throw error if device is not connected", async () => {
      // given
      const transport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      // when
      vi.spyOn(dmk, "listConnectedDevices").mockReturnValue([]);
      // then
      try {
        await transport.disconnectDevice("deviceId");
      } catch (e) {
        expect(e).toEqual(new Error(`Device deviceId is not connected`));
      }
    });

    it("should disconnect a device", async () => {
      // given
      const transport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listConnectedDevices").mockReturnValue([
        {
          id: "deviceId",
          sessionId: "sessionId",
        } as ConnectedDevice,
      ]);
      vi.spyOn(dmk, "disconnect").mockResolvedValue(undefined);
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
        }),
      );
      try {
        // when
        const ret = await transport.disconnectDevice("deviceId");

        // then
        expect(dmk.disconnect).toHaveBeenCalledWith({ sessionId: "sessionId" });
        expect(dmk.getDeviceSessionState).toHaveBeenCalledWith({ sessionId: "sessionId" });
        expect(ret).toBeUndefined();
      } catch (e) {
        // should not happen
        console.error(e);
      }
    });

    it("should throw error if dmk disconnect throws", async () => {
      // given
      const transport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listConnectedDevices").mockReturnValue([
        {
          id: "deviceId",
          sessionId: "sessionId",
        } as ConnectedDevice,
      ]);
      vi.spyOn(dmk, "disconnect").mockRejectedValue(new Error("Disconnect error"));
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
        }),
      );
      try {
        // when
        await transport.disconnectDevice("deviceId");
      } catch (e) {
        // then
        expect(e).toEqual(new Error("Disconnect error"));
      }
    });
  });

  describe("open", () => {
    afterEach(() => {
      vi.clearAllMocks();
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);
    });
    it("should return the active transport", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      const activeTransport = new DeviceManagementKitTransport(dmk, "sessionId");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        sessionId: "sessionId",
        transport: activeTransport,
      });
      vi.spyOn(dmk, "getConnectedDevice").mockReturnValue({
        id: "deviceId",
      } as ConnectedDevice);

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(transport).toEqual(activeTransport);
    });
    it("should scan and connect if get dmk device session state throws", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      const activeTransport = new DeviceManagementKitTransport(dmk, "sessionId");
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(new Error("get device session state error"));
        }),
      );
      vi.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      vi.spyOn(dmk, "getConnectedDevice").mockReturnValue({} as ConnectedDevice);
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => subscriber.next([{ id: "deviceId" }] as DiscoveredDevice[])),
      );
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        sessionId: "sessionId",
        transport: activeTransport,
      });
      vi.spyOn(activeDeviceSessionSubject, "next");

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(activeDeviceSessionSubject.next).toHaveBeenCalledWith({
        sessionId: "sessionId",
        transport: transport,
      });
    });
    it("should return a new transport after dmk scanning and connect", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([{ id: "deviceId" } as DiscoveredDevice]);
        }),
      );
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);
      vi.spyOn(dmk, "connect").mockResolvedValue("sessionId");

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(transport.sessionId).toEqual("sessionId");
    });
    it("should connect to an already discovered device", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const device = { id: "deviceId" } as DiscoveredDevice;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      // when
      const transport = await staticTransport.open(device);
      // then
      expect(transport.sessionId).toEqual("sessionId");
    });
  });

  describe("listen", () => {
    let subscription: TransportSubscription | undefined = undefined;
    afterEach(() => {
      vi.clearAllMocks();
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    });
    it("should listen to available devices", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([
            {
              deviceModel: {
                model: "flex",
              },
            },
          ] as DiscoveredDevice[]);
        }),
      );
      vi.spyOn(observer, "next");

      // when
      subscription = staticTransport.listen(observer);

      // then
      expect(observer.next).toHaveBeenCalledWith({
        type: "add",
        descriptor: "",
        device: {
          deviceModel: {
            model: "flex",
          },
        },
        deviceModel: {
          id: "europa",
        },
      });
    });
    it("should call stopDiscovering if unsubscribed", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "stopDiscovering");
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([]);
        }),
      );
      const observer = new Subject();
      // when
      subscription = staticTransport.listen(observer);
      subscription.unsubscribe();
      subscription = undefined;
      // then
      expect(dmk.stopDiscovering).toHaveBeenCalled();
    });
    it("should emit error if dmk listenToAvailableDevices throws", async () => {
      // given
      const staticTransport = DeviceManagementKitTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(new Error("error"));
        }),
      );
      vi.spyOn(observer, "error");

      // when
      subscription = staticTransport.listen(observer);

      // then
      expect(observer.error).toHaveBeenCalledWith(new Error("error"));
    });
  });

  // FixMe listenToDisconnect subscription should be cleared at some point
  describe("listenToDisconnect", () => {
    let subscription: Subscription | undefined = undefined;

    afterEach(() => {
      vi.clearAllMocks();
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    });
    it("should emit disconnect and reset active session if device session not connected", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber =>
          subscriber.next({
            deviceStatus: DeviceStatus.NOT_CONNECTED,
          } as DeviceSessionState),
        ),
      );
      const transport = new DeviceManagementKitTransport(dmk, "session");
      vi.spyOn(activeDeviceSessionSubject, "next");
      vi.spyOn(transport, "emit");

      // when
      subscription = transport.listenToDisconnect();

      // then
      //expect(activeDeviceSessionSubject.next).toHaveBeenCalledWith(null);
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
    it("should not emit disconnect and reset active session if device session connected", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber =>
          subscriber.next({
            deviceStatus: DeviceStatus.CONNECTED,
          } as DeviceSessionState),
        ),
      );
      const transport = new DeviceManagementKitTransport(dmk, "session");
      vi.spyOn(activeDeviceSessionSubject, "next");
      vi.spyOn(transport, "emit");

      // when
      subscription = transport.listenToDisconnect();

      // then
      expect(activeDeviceSessionSubject.next).toHaveBeenCalledTimes(0);
      expect(transport.emit).toHaveBeenCalledTimes(0);
    });
    it("should emit disconnect on dmk listen error", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(new Error("error"));
        }),
      );
      const transport = new DeviceManagementKitTransport(dmk, "session");
      vi.spyOn(transport, "emit");

      // when
      subscription = transport.listenToDisconnect();

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
    it("should emit disconnect on dmk listen complete", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.complete();
        }),
      );
      const transport = new DeviceManagementKitTransport(dmk, "session");
      vi.spyOn(transport, "emit");

      // when
      subscription = transport.listenToDisconnect();

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
  });

  describe.skip("close", () => {}); //Nothing on close

  describe("disconnect", () => {
    it("should call dmk disconnect", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitTransport(getDeviceManagementKit(), "session");
      vi.spyOn(dmk, "disconnect").mockResolvedValue(undefined);
      // when
      transport.disconnect();
      // then
      expect(dmk.disconnect).toHaveBeenCalledWith({ sessionId: "session" });
    });
  });

  describe("exchange", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    it("should throw an error if no active session", async () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);
      const transport = new DeviceManagementKitTransport(dmk, "session");
      try {
        // when
        await transport.exchange(Buffer.from([]));
      } catch (e) {
        // then
        expect(e).toEqual(new Error("No active session found"));
      }
    });

    it("should call dmk sendApdu and return response", async () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitTransport(dmk, "session");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        sessionId: "session",
        transport: transport,
      });
      vi.spyOn(dmk, "sendApdu").mockResolvedValue({
        data: Uint8Array.from([0x42, 0x21, 0x34, 0x44, 0x54, 0x67, 0x89]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      });
      const abortTimeoutMs = 42;

      // when
      const response = await transport.exchange(Buffer.from([0x43, 0x89, 0x04, 0x30, 0x44]), {
        abortTimeoutMs,
      });

      // then
      expect(dmk.sendApdu).toHaveBeenCalledWith({
        sessionId: "session",
        apdu: Uint8Array.from([0x43, 0x89, 0x04, 0x30, 0x44]),
        abortTimeout: abortTimeoutMs,
      });
      expect(response).toEqual(Buffer.from([0x42, 0x21, 0x34, 0x44, 0x54, 0x67, 0x89, 0x90, 0x00]));
    });

    it("should return an error if dmk sendApdu throws", async () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitTransport(dmk, "session");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        sessionId: "session",
        transport: transport,
      });
      vi.spyOn(dmk, "sendApdu").mockRejectedValue(new Error("SendApdu error"));

      try {
        // when
        await transport.exchange(Buffer.from([0x43, 0x89, 0x04, 0x30, 0x44]));
      } catch (e) {
        // then
        expect(e).toEqual(new Error("SendApdu error"));
      }
    });
  });
});
