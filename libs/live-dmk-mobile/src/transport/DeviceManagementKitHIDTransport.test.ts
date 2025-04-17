import { getDeviceManagementKit } from "../hooks";
import { Observable, Subject } from "rxjs";
import { afterEach, beforeEach, expect } from "vitest";
import {
  ConnectedDevice,
  DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  activeDeviceSessionSubject,
  DeviceManagementKitHIDTransport,
} from "./DeviceManagementKitHIDTransport";
import type { Subscription as TransportSubscription } from "@ledgerhq/hw-transport";

describe("DeviceManagementKitHIDTransport", () => {
  describe("open", () => {
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
    it("should connect to an already discovered device", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "connect").mockResolvedValue("sessionId");
      // when
      const transport = await staticTransport.open("deviceId");
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
    it("should emit error if dmk listenToAvailableDevices throws", async () => {
      // given
      const staticTransport = DeviceManagementKitHIDTransport;
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

  describe("close", () => {
    it("should stop dmk discovering", () => {
      // given
      const dmk = getDeviceManagementKit();
      vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(dmk, "session");
      vi.spyOn(dmk, "stopDiscovering");
      // when
      transport.close();
      // then
      expect(dmk.stopDiscovering).toHaveBeenCalled();
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
      vi.clearAllMocks();
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
});
