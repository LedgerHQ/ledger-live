import { BehaviorSubject, Observable, Subject } from "rxjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ConnectedDevice,
  DeviceManagementKit,
  DeviceModelId as DMKDeviceModelId,
  DeviceSessionState,
  DeviceSessionStateType,
  DeviceStatus,
  DiscoveredDevice,
  SendApduEmptyResponseError,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
} from "@ledgerhq/device-management-kit";
import {
  DeviceManagementKitHIDTransport,
  activeDeviceSessionSubject,
} from "./DeviceManagementKitHIDTransport";
import type { Subscription as TransportSubscription } from "@ledgerhq/hw-transport";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { getDeviceModel } from "@ledgerhq/devices";
import { DisconnectedDevice } from "@ledgerhq/errors";

function createMockDMK(): DeviceManagementKit {
  const mock = {
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
      model: DMKDeviceModelId.FLEX,
      name: "FLEX",
      id: DMKDeviceModelId.FLEX,
    },
    transport: "RN_HID",
    ...overrides,
  };
};

describe("DeviceManagementKitHIDTransport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("open", () => {
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
      const mockDMK = createMockDMK();
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const mockedDiscoveredDevice = createMockDiscoveredDevice({ id: "deviceId" });
      const discoveredDevices: DiscoveredDevice[] = [mockedDiscoveredDevice];
      vi.mocked(mockDMK.listenToAvailableDevices).mockReturnValue(
        new Observable(subscriber => {
          subscriber.next(discoveredDevices);
        }),
      );
      vi.spyOn(observer, "next");

      // when
      subscription = staticTransport.listen(observer, undefined, mockDMK);

      // then
      expect(observer.next).toHaveBeenCalledWith({
        type: "add",
        descriptor: "deviceId",
        device: mockedDiscoveredDevice,
        deviceModel: getDeviceModel(DeviceModelId.europa),
      });
    });

    it("should emit one add and one remove", async () => {
      // given
      const mockDMK = createMockDMK();
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const discoveredDevice = createMockDiscoveredDevice({ id: "deviceId" });

      const discoveredDevicesSubject = new Subject<DiscoveredDevice[]>();

      vi.mocked(mockDMK.listenToAvailableDevices).mockReturnValue(
        discoveredDevicesSubject.asObservable(),
      );
      vi.spyOn(observer, "next");
      // when
      subscription = staticTransport.listen(observer, undefined, mockDMK);

      discoveredDevicesSubject.next([discoveredDevice]);
      discoveredDevicesSubject.next([]);

      // then
      await vi.waitFor(() => {
        expect(observer.next).toHaveBeenNthCalledWith(1, {
          type: "add",
          descriptor: "deviceId",
          device: discoveredDevice,
          deviceModel: getDeviceModel(DeviceModelId.europa),
        });
        expect(observer.next).toHaveBeenNthCalledWith(2, {
          type: "remove",
          descriptor: "deviceId",
          device: discoveredDevice,
        });
      });
    });

    it("should emit error if dmk listenToAvailableDevices throws", async () => {
      // given
      const mockDMK = createMockDMK();
      const staticTransport = DeviceManagementKitHIDTransport;
      const observer = new Subject();
      const error = new Error("error");
      vi.mocked(mockDMK.listenToAvailableDevices).mockReturnValue(
        new Observable(subscriber => {
          subscriber.error(error);
        }),
      );
      vi.spyOn(observer, "error");

      // when
      subscription = staticTransport.listen(observer, undefined, mockDMK);

      // then
      expect(observer.error).toHaveBeenCalledWith(error);
    });
  });

  describe("close", () => {
    it("should just resolve", async () => {
      const mockDMK = createMockDMK();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      await transport.close();
    });
  });

  describe("exchange", () => {
    it("should throw an error if no active session", async () => {
      // given
      const mockDMK = createMockDMK();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");

      // when
      const result = transport.exchange(Buffer.from([]));

      // then
      let caughtError;
      await result.catch(e => {
        caughtError = e;
      });
      expect(caughtError).toEqual(new DisconnectedDevice());
    });

    it("should call dmk sendApdu and return response", async () => {
      // given
      const mockDMK = createMockDMK();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());

      const mockSendApdu = vi.mocked(mockDMK.sendApdu);
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        transport,
      });
      vi.mocked(mockDMK.sendApdu).mockResolvedValue({
        data: Uint8Array.from([0x42, 0x21, 0x34, 0x44, 0x54, 0x67, 0x89]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      });
      const abortTimeoutMs = 42;

      // when
      const response = await transport.exchange(Buffer.from([0x43, 0x89, 0x04, 0x30, 0x44]), {
        abortTimeoutMs,
      });

      // then
      expect(mockSendApdu).toHaveBeenCalledWith({
        sessionId: "session",
        apdu: Uint8Array.from([0x43, 0x89, 0x04, 0x30, 0x44]),
        abortTimeout: abortTimeoutMs,
      });
      expect(response).toEqual(Buffer.from([0x42, 0x21, 0x34, 0x44, 0x54, 0x67, 0x89, 0x90, 0x00]));
    });

    it("should return an error if dmk sendApdu throws", async () => {
      // given
      const mockDMK = createMockDMK();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const mockSendApdu = vi.mocked(mockDMK.sendApdu);
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        transport,
      });
      mockSendApdu.mockRejectedValue(new Error("SendApdu error"));

      // when
      const result = transport.exchange(Buffer.from([0x43, 0x89, 0x04, 0x30, 0x44]));

      // then
      let caughtError;
      await result.catch(e => {
        caughtError = e;
      });
      expect(caughtError).toEqual(new Error("SendApdu error"));
    });

    [
      new SendApduEmptyResponseError(),
      new DeviceDisconnectedWhileSendingError(),
      new DeviceDisconnectedBeforeSendingApdu(),
    ].forEach(error => {
      it(`should remap ${error.constructor.name} to DisconnectedDevice`, async () => {
        // given
        const mockDMK = createMockDMK();
        vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
        const mockSendApdu = vi.mocked(mockDMK.sendApdu);
        const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
        vi.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
          transport,
        });
        mockSendApdu.mockRejectedValue(error);

        // when
        const result = transport.exchange(Buffer.from([0x43, 0x89, 0x04, 0x30, 0x44]));

        // then
        let caughtError;
        await result.catch(e => {
          caughtError = e;
        });
        expect(caughtError).toEqual(new DisconnectedDevice());
      });
    });
  });

  describe("listenToDisconnect", () => {
    it("should be called on new transport", () => {
      // given
      const mockDMK = createMockDMK();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      vi.spyOn(DeviceManagementKitHIDTransport.prototype, "listenToDisconnect");

      // when
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");

      // then
      expect(transport.listenToDisconnect).toHaveBeenCalled();
    });

    it("when the device gets disconnected, it should reset activeDeviceSession and emit disconnect", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        deviceSessionStateSubject.asObservable(),
      );
      vi.spyOn(activeDeviceSessionSubject, "next");
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      vi.spyOn(transport, "emit");

      // when
      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      // then
      expect(activeDeviceSessionSubject.next).toHaveBeenCalledWith(null);
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("when the device state changes to another state than NOT_CONNECTED, it should not reset activeDeviceSession and not emit disconnect", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        deviceSessionStateSubject.asObservable(),
      );
      vi.spyOn(activeDeviceSessionSubject, "next");

      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      vi.spyOn(transport, "emit");

      // when
      deviceSessionStateSubject.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.BUSY,
      });

      // then
      expect(activeDeviceSessionSubject.next).not.toHaveBeenCalled();
      expect(transport.emit).not.toHaveBeenCalled();
    });

    it("should emit disconnect on complete", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        deviceSessionStateSubject.asObservable(),
      );
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      vi.spyOn(transport, "emit");

      // when
      deviceSessionStateSubject.complete();

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should emit disconnect on error", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      vi.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        deviceSessionStateSubject.asObservable(),
      );
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      vi.spyOn(transport, "emit");

      // when
      deviceSessionStateSubject.error(new Error("error"));

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
  });
});
