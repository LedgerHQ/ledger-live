import { BlePlxManager } from "./BlePlxManager";
import { DeviceManagementKitBLETransport, tracer } from "./DeviceManagementKitBLETransport";
import { Observable, Subject } from "rxjs";
import { State } from "react-native-ble-plx";
import { getDeviceManagementKit } from "../hooks";
import {
  ConnectedDevice,
  DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionRegistry } from "@ledgerhq/live-dmk-shared";
import type { Subscription as TransportSubscription } from "@ledgerhq/hw-transport";

describe("DeviceManagementKitBLETransport", () => {
  afterEach(() => {
    activeDeviceSessionRegistry.dispose();
    jest.clearAllMocks();
  });

  describe("setLogLevel", () => {
    it("should trace not implemented", () => {
      // given
      const transport = DeviceManagementKitBLETransport;
      // when
      jest.spyOn(tracer, "trace");
      transport.setLogLevel("TEST");
      // then
      expect(tracer.trace).toHaveBeenCalledWith("setLogLevel not implemented", { level: "TEST" });
    });
  });

  describe("observeState", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should emit available", () => {
      // given
      const observer = new Subject<{ type: string; available: boolean }>();
      jest.spyOn(observer, "next");
      jest.spyOn(BlePlxManager.instance, "onStateChange").mockImplementation(callback => {
        callback(State.PoweredOn);
        return {
          remove: () => null,
        };
      });
      const transport = DeviceManagementKitBLETransport;
      // when
      transport.observeState(observer);
      // then
      expect(observer.next).toHaveBeenCalledWith({ type: "PoweredOn", available: true });
    });

    it("should not emit available", () => {
      // given
      const observer = new Subject<{ type: string; available: boolean }>();
      jest.spyOn(observer, "next");
      jest.spyOn(BlePlxManager.instance, "onStateChange").mockImplementation(callback => {
        callback(State.PoweredOff);
        return {
          remove: () => null,
        };
      });
      const transport = DeviceManagementKitBLETransport;
      // when
      transport.observeState(observer);
      // then
      expect(observer.next).toHaveBeenCalledWith({ type: "PoweredOff", available: false });
    });
    it("should call remove on unsubscribe", () => {
      // given
      const observer = new Subject<{ type: string; available: boolean }>();
      const rmBleObs = jest.fn();
      jest.spyOn(observer, "next");
      jest.spyOn(BlePlxManager.instance, "onStateChange").mockImplementation(callback => {
        callback(State.PoweredOff);
        return {
          remove: rmBleObs,
        };
      });
      const transport = DeviceManagementKitBLETransport;

      // when
      const sub = transport.observeState(observer);
      sub.unsubscribe();

      // then
      expect(rmBleObs).toHaveBeenCalled();
    });
  });

  describe("disconnectDevice", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("should throw error if device is not connected", async () => {
      // given
      const transport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      // when
      jest.spyOn(dmk, "listConnectedDevices").mockReturnValue([]);
      // then
      try {
        await transport.disconnectDevice("deviceId");
      } catch (e) {
        expect(e).toEqual(new Error(`Device deviceId is not connected`));
      }
    });

    it("should disconnect a device", async () => {
      // given
      const transport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "listConnectedDevices").mockReturnValue([
        {
          id: "deviceId",
          sessionId: "sessionId",
        } as ConnectedDevice,
      ]);
      jest.spyOn(dmk, "disconnect").mockResolvedValue(undefined);
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
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
      const transport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "listConnectedDevices").mockReturnValue([
        {
          id: "deviceId",
          sessionId: "sessionId",
        } as ConnectedDevice,
      ]);
      jest.spyOn(dmk, "disconnect").mockRejectedValue(new Error("Disconnect error"));
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
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
      activeDeviceSessionRegistry.dispose();
      jest.clearAllMocks();
    });
    it("should return a BLE transport for a reusable registry session", async () => {
      // given
      const staticTransport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      activeDeviceSessionRegistry.addSession({ sessionId: "sessionId", dmk });
      jest.spyOn(dmk, "getConnectedDevice").mockReturnValue({
        id: "deviceId",
        type: "BLE",
      } as ConnectedDevice);

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(transport).toBeInstanceOf(DeviceManagementKitBLETransport);
      expect(transport.sessionId).toEqual("sessionId");
    });
    it("should scan and connect if the registry session is stale", async () => {
      // given
      const staticTransport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      activeDeviceSessionRegistry.addSession({ sessionId: "staleSessionId", dmk });
      jest.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      jest.spyOn(dmk, "getConnectedDevice").mockImplementation(() => {
        throw new Error("stale session");
      });
      jest
        .spyOn(dmk, "listenToAvailableDevices")
        .mockReturnValue(
          new Observable(subscriber => subscriber.next([{ id: "deviceId" }] as DiscoveredDevice[])),
        );

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(transport.sessionId).toEqual("sessionId");
      expect(activeDeviceSessionRegistry.getSession("staleSessionId")).toBeNull();
      expect(activeDeviceSessionRegistry.getSession("sessionId")).toEqual({ sessionId: "sessionId", dmk });
    });
    it("should return a new transport after dmk scanning and connect", async () => {
      // given
      const staticTransport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([{ id: "deviceId" } as DiscoveredDevice]);
        }),
      );
      jest.spyOn(dmk, "connect").mockResolvedValue("sessionId");

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(transport.sessionId).toEqual("sessionId");
    });
    it("should connect to an already discovered device", async () => {
      // given
      const staticTransport = DeviceManagementKitBLETransport;
      const device = { id: "deviceId" } as DiscoveredDevice;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      // when
      const transport = await staticTransport.open(device);
      // then
      expect(transport.sessionId).toEqual("sessionId");
    });
  });

  describe("listen", () => {
    let subscription: TransportSubscription | undefined = undefined;
    afterEach(() => {
      jest.clearAllMocks();
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    });
    it("should listen to available devices", async () => {
      // given
      const staticTransport = DeviceManagementKitBLETransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
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
      jest.spyOn(observer, "next");

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
      const staticTransport = DeviceManagementKitBLETransport;
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "stopDiscovering");
      jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
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
      const staticTransport = DeviceManagementKitBLETransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(new Error("error"));
        }),
      );
      jest.spyOn(observer, "error");

      // when
      subscription = staticTransport.listen(observer);

      // then
      expect(observer.error).toHaveBeenCalledWith(new Error("error"));
    });
  });

  describe("registry disconnect bridge", () => {
    it("should emit disconnect when its registry session is removed", () => {
      // given
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      activeDeviceSessionRegistry.addSession({ sessionId: "session", dmk });
      const transport = new DeviceManagementKitBLETransport(dmk, "session");
      jest.spyOn(transport, "emit");

      // when
      activeDeviceSessionRegistry.removeSession("session");

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
  });

  describe.skip("close", () => {}); //Nothing on close

  describe("disconnect", () => {
    it("should call dmk disconnect", () => {
      // given
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitBLETransport(getDeviceManagementKit(), "session");
      jest.spyOn(dmk, "disconnect").mockResolvedValue(undefined);
      // when
      transport.disconnect();
      // then
      expect(dmk.disconnect).toHaveBeenCalledWith({ sessionId: "session" });
    });
  });

  describe("exchange", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should use its own session even when the registry has no active session", async () => {
      // given
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitBLETransport(dmk, "session");
      jest.spyOn(dmk, "sendApdu").mockResolvedValue({
        data: Uint8Array.from([]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      });

      // when
      await transport.exchange(Buffer.from([]));

      // then
      expect(dmk.sendApdu).toHaveBeenCalledWith({
        sessionId: "session",
        apdu: Uint8Array.from([]),
        abortTimeout: undefined,
      });
    });

    it("should call dmk sendApdu and return response", async () => {
      // given
      const dmk = getDeviceManagementKit();
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitBLETransport(dmk, "session");
      jest.spyOn(dmk, "sendApdu").mockResolvedValue({
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
      jest.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitBLETransport(dmk, "session");
      jest.spyOn(dmk, "sendApdu").mockRejectedValue(new Error("SendApdu error"));

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
