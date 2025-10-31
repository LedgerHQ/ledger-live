import { BehaviorSubject, Observable, Observer, Subject, Subscriber, Subscription } from "rxjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import {
  ConnectedDevice,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  DeviceModelId,
  DeviceSessionState,
  DeviceSessionStateType,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  DeviceManagementKitHIDTransport,
  activeDeviceSessionSubject,
  tracer,
} from "./DeviceManagementKitHIDTransport";
import type { Subscription as TransportSubscription } from "@ledgerhq/hw-transport";
import { Device } from "react-native-ble-plx";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";

function createMockDMK(): DeviceManagementKit {
  // const baseDMK = new DeviceManagementKitBuilder().build();
  const mock = {
    // ...baseDMK,
    getDeviceSessionState: vi.fn<DeviceManagementKit["getDeviceSessionState"]>(),
    getConnectedDevice: vi.fn<DeviceManagementKit["getConnectedDevice"]>(),
    connect: vi.fn<DeviceManagementKit["connect"]>(),
    disconnect: vi.fn<DeviceManagementKit["disconnect"]>(),
    listenToAvailableDevices: vi.fn<DeviceManagementKit["listenToAvailableDevices"]>(),
    listenToConnectedDevice: vi.fn<DeviceManagementKit["listenToConnectedDevice"]>(),
    sendApdu: vi.fn<DeviceManagementKit["sendApdu"]>(),
  };
  return mock as unknown as DeviceManagementKit;
}

const aMockedDeviceSessionState: DeviceSessionState = {
  deviceStatus: DeviceStatus.CONNECTED,
  sessionStateType: DeviceSessionStateType.Connected,
  deviceModelId: DeviceModelId.FLEX,
};

const createMockDiscoveredDevice = (
  overrides: Partial<DiscoveredDevice> = {},
): DiscoveredDevice => {
  return {
    id: "deviceId",
    name: "FLEX",
    deviceModel: {
      model: DeviceModelId.FLEX,
      name: "FLEX",
      id: DeviceModelId.FLEX,
    },
    transport: "RN_HID",
    ...overrides,
  };
};

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
      const mockDMK = createMockDMK();
      const deviceSessionState = aMockedDeviceSessionState;
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        new Observable(subscriber => {
          subscriber.next(deviceSessionState);
        }),
      );
      const activeTransport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        transport: activeTransport,
      });
      const connectedDevice: ConnectedDevice = {
        id: "deviceId",
        type: "USB",
        sessionId: "sessionId",
        modelId: DeviceModelId.FLEX,
        name: "FLEX",
      };
      vi.mocked(mockDMK.getConnectedDevice).mockReturnValue(connectedDevice);

      // when
      const transport = await DeviceManagementKitHIDTransport.open(
        "deviceId",
        undefined,
        undefined,
        mockDMK,
      );

      // then
      expect(transport).toEqual(activeTransport);
    });

    describe("given there is an an active session", () => {
      it("when it is in a connected state, it should return the associated transport", async () => {
        // given
        const mockDMK = createMockDMK();

        vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
          new BehaviorSubject({
            ...aMockedDeviceSessionState,
            deviceStatus: DeviceStatus.CONNECTED,
          }).asObservable(),
        );
        const activeTransport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
        vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
          transport: activeTransport,
        });

        vi.mocked(mockDMK.getConnectedDevice).mockReturnValue({
          id: "deviceId",
          type: "USB",
          sessionId: "sessionId",
          modelId: DeviceModelId.FLEX,
          name: "FLEX",
        });

        // when
        const transport = await DeviceManagementKitHIDTransport.open(
          "",
          undefined,
          undefined,
          mockDMK,
        );

        // then
        expect(transport).toEqual(activeTransport);
      });

      it("when it is in a NOT_CONNECTED state, it should wait for a new device to be available and return a new transport", async () => {
        // given
        const mockDMK = createMockDMK();
        vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
          new BehaviorSubject({
            ...aMockedDeviceSessionState,
            deviceStatus: DeviceStatus.NOT_CONNECTED,
          }).asObservable(),
        );
        const activeTransport = new DeviceManagementKitHIDTransport(mockDMK, "sessionIdA");
        vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
          transport: activeTransport,
        });

        vi.mocked(mockDMK.getConnectedDevice).mockReturnValue({
          id: "deviceId",
          type: "USB",
          sessionId: "sessionId",
          modelId: DeviceModelId.FLEX,
          name: "FLEX",
        });

        const mockedDiscoveredDevice = createMockDiscoveredDevice();
        const mockedListenToAvailableDevices = vi.mocked(mockDMK.listenToAvailableDevices);
        mockedListenToAvailableDevices.mockReturnValue(
          new Observable(subscriber => {
            subscriber.next([mockedDiscoveredDevice]);
          }),
        );
        const mockedConnect = vi.mocked(mockDMK.connect);
        mockedConnect.mockResolvedValue("sessionIdB");

        // when
        const transport = await DeviceManagementKitHIDTransport.open(
          "",
          undefined,
          undefined,
          mockDMK,
        );

        // then
        expect(transport).not.toEqual(activeTransport);
        expect(transport.sessionId).toEqual("sessionIdB");
        expect(mockedListenToAvailableDevices).toHaveBeenCalledWith({
          transport: rnHidTransportIdentifier,
        });
        expect(mockedConnect).toHaveBeenCalledWith({
          device: mockedDiscoveredDevice,
          sessionRefresherOptions: { isRefresherDisabled: true },
        });
      });
    });

    it("given there is no active session, it should wait for a new device to be available and return a new transport", async () => {
      // given
      const mockDMK = createMockDMK();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        new BehaviorSubject({
          ...aMockedDeviceSessionState,
          deviceStatus: DeviceStatus.NOT_CONNECTED,
        }).asObservable(),
      );
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);

      const mockedDiscoveredDevice = createMockDiscoveredDevice();
      const mockedListenToAvailableDevices = vi.mocked(mockDMK.listenToAvailableDevices);
      mockedListenToAvailableDevices.mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([mockedDiscoveredDevice]);
        }),
      );
      const mockedConnect = vi.mocked(mockDMK.connect);
      mockedConnect.mockResolvedValue("sessionId");

      // when
      const transport = await DeviceManagementKitHIDTransport.open(
        "",
        undefined,
        undefined,
        mockDMK,
      );

      // then
      expect(transport).toBeInstanceOf(DeviceManagementKitHIDTransport);
      expect(transport.sessionId).toEqual("sessionId");
      expect(mockedListenToAvailableDevices).toHaveBeenCalledWith({
        transport: rnHidTransportIdentifier,
      });
      expect(mockedConnect).toHaveBeenCalledWith({
        device: mockedDiscoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
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
