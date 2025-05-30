import { getDeviceManagementKit } from "../hooks";
import { Observable, Subject } from "rxjs";
import { beforeEach, expect } from "vitest";
import {
  ConnectedDevice,
  DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  activeDeviceSessionSubject,
  DeviceManagementKitHIDTransport,
  tracer,
} from "./DeviceManagementKitHIDTransport";
import type { Subscription as TransportSubscription } from "@ledgerhq/hw-transport";

describe("DeviceManagementKitHIDTransport", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("open", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });
    it("should return the active transport", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
        }),
      );
      const activeTransport = new DeviceManagementKitHIDTransport(dmk, "sessionId");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        sessionId: "sessionId",
        transport: activeTransport,
      });
      vi.spyOn(dmk, "getConnectedDevice").mockReturnValue({
        id: "deviceId",
        type: "USB",
      } as ConnectedDevice);

      // when
      const transport = await staticTransport.open("deviceId");

      // then
      expect(transport).toEqual(activeTransport);
    });
    it("should connect to a new device", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      // when
      const transport = await staticTransport.open("deviceId");
      // then
      expect(transport.sessionId).toEqual("sessionId");
    });
    it("should connect to a dmk connected device", async () => {
      // given
      console.log("activeDeviceSessionSubject.getValue", activeDeviceSessionSubject.getValue());
      const staticTransport = DeviceManagementKitHIDTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      vi.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      // when
      const transport = await staticTransport.open("deviceId");
      // then
      expect(transport.sessionId).toEqual("sessionId");
    });
    it("should reconnect to a device without id", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "connect").mockImplementation(async ({ device: { id } }) => {
        if (id === "oldDeviceId") {
          throw {
            _tag: "ConnectionOpeningError",
          };
        }
        return "sessionId";
      });
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
        }),
      );
      vi.spyOn(dmk, "getConnectedDevice").mockReturnValue({ id: "deviceId" } as ConnectedDevice);
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        sessionId: "oldSession",
        transport: new DeviceManagementKitHIDTransport(dmk, "oldSession"),
      });
      vi.spyOn(activeDeviceSessionSubject, "next");
      vi.spyOn(dmk, "disconnect").mockResolvedValueOnce();
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([{ id: "newDeviceId" }] as DiscoveredDevice[]);
        }),
      );
      // when
      const transport = await staticTransport.open("oldDeviceId");
      // then
      vi.waitFor(() => {
        expect(dmk.disconnect).toHaveBeenCalled();
        expect(transport.sessionId).toEqual("sessionId");
        expect(dmk.connect).toHaveBeenCalledWith({
          device: {
            id: "newDeviceId",
            transport: "RN_HID",
          },
          sessionRefresherOptions: { isRefresherDisabled: true },
        });
      });
    });
  });

  describe("listen", () => {
    let subscription: TransportSubscription | undefined = undefined;
    beforeEach(() => {
      vi.resetAllMocks();
      if (subscription) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    });
    it("should listen to available devices", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([
            {
              id: "id",
              name: "FLEX",
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
        descriptor: "id",
        device: {
          deviceModel: {
            model: "flex",
          },
          id: "id",
          name: "FLEX",
        },
        deviceModel: {
          id: "europa",
          productName: "FLEX",
        },
      });
    });
    it("should emit one add and one remove", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const device = {
        type: "USB",
        sessionId: "session",
        id: "id",
        name: "FLEX",
        modelId: "flex",
        deviceModel: {
          model: "flex",
        },
      } as ConnectedDevice;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(new Observable());
      vi.spyOn(dmk, "listenToConnectedDevice").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next(device);
        }),
      );
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
          subscriber.next({ deviceStatus: DeviceStatus.BUSY } as DeviceSessionState);
          subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
        }),
      );
      vi.spyOn(observer, "next");
      // when
      subscription = staticTransport.listen(observer);
      // then
      vi.waitFor(() => {
        expect(observer.next).toHaveBeenNthCalledWith(1, {
          type: "add",
          descriptor: "id",
          device,
          deviceModel: {
            id: "europa",
            productName: "FLEX",
          },
        });
        expect(observer.next).toHaveBeenNthCalledWith(1, {
          type: "remove",
          descriptor: "id",
          device,
        });
      });
    });
    it("should emit error if dmk listenToAvailableDevices throws", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToConnectedDevice").mockReturnValue(new Observable());
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
    it("log error if getDeviceSessionState throws", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToConnectedDevice").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ type: "USB" } as ConnectedDevice);
        }),
      );
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(new Error("error"));
        }),
      );
      vi.spyOn(tracer, "trace");
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(new Observable());

      // when
      subscription = staticTransport.listen(observer);

      // then
      expect(tracer.trace).toHaveBeenCalledWith(expect.anything(), new Error("error"));
    });
    it("should emit error if dmk getDeviceSessionState throws", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToConnectedDevice").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ id: "device", type: "USB" } as ConnectedDevice);
        }),
      );
      vi.spyOn(dmk, "getDeviceSessionState").mockImplementation(() => {
        throw new Error("error");
      });
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(new Observable());
      vi.spyOn(observer, "error");

      // when
      subscription = staticTransport.listen(observer);

      // then
      expect(observer.error).toHaveBeenCalledWith(new Error("error"));
    });
    it("should not emit error if dmk getDeviceSessionState throws DeviceSessionNotFound", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "listenToConnectedDevice").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ id: "device", type: "USB" } as ConnectedDevice);
        }),
      );
      vi.spyOn(dmk, "getDeviceSessionState").mockImplementation(() => {
        throw {
          _tag: "DeviceSessionNotFound",
        };
      });
      vi.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(new Observable());
      vi.spyOn(observer, "error");

      // when
      subscription = staticTransport.listen(observer);

      // then
      expect(observer.error).not.toHaveBeenCalled();
    });
  });

  describe("close", () => {
    it("should log", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
      vi.spyOn(tracer, "trace");
      // when
      transport.close();
      // then
      expect(tracer.trace).toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("should call dmk disconnect", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(getDeviceManagementKit(), "session");
      vi.spyOn(dmk, "disconnect").mockResolvedValue(undefined);
      // when
      transport.disconnect();
      // then
      expect(dmk.disconnect).toHaveBeenCalledWith({ sessionId: "session" });
    });
  });

  describe("exchange", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });
    it("should throw an error if no active session", async () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
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
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
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
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
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

  describe("listenToDisconnect", () => {
    it("should be called on new transport", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      vi.spyOn(DeviceManagementKitHIDTransport.prototype, "listenToDisconnect");
      // when
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
      // then
      expect(transport.listenToDisconnect).toHaveBeenCalled();
    });
    it("should reset activeDeviceSession if disconnected", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
        }),
      );
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
      // when
      vi.spyOn(transport, "emit");
      vi.spyOn(activeDeviceSessionSubject, "next");
      // then
      vi.waitFor(() => {
        expect(activeDeviceSessionSubject.next).toHaveBeenCalledWith(null);
        expect(transport.emit).toHaveBeenCalledWith("disconnect");
      });
    });
    it("should emit disconnect on complete", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.complete();
        }),
      );
      const transport = new DeviceManagementKitHIDTransport(dmk, "sessionId");
      // when
      vi.spyOn(transport, "emit");
      // then
      vi.waitFor(() => {
        expect(transport.emit).toHaveBeenCalledWith("disconnect");
      });
    });
    it("should emit disconnect on error", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(new Error("error"));
        }),
      );
      const transport = new DeviceManagementKitHIDTransport(dmk, "sessionId");
      // when
      vi.spyOn(transport, "emit");
      vi.spyOn(tracer, "trace");
      // then
      vi.waitFor(() => {
        expect(tracer.trace).toHaveBeenCalledWith(expect.anything(), new Error("error"));
        expect(transport.emit).toHaveBeenCalledWith("disconnect");
      });
    });
  });
});
