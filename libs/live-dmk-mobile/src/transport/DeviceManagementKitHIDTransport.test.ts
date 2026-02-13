import { BehaviorSubject, Observable, Subject } from "rxjs";
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
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { DisconnectedDevice } from "@ledgerhq/errors";

function createMockDMK(): DeviceManagementKit {
  const mock = {
    getDeviceSessionState: jest.fn<DeviceManagementKit["getDeviceSessionState"]>(),
    getConnectedDevice: jest.fn<DeviceManagementKit["getConnectedDevice"]>(),
    connect: jest.fn<DeviceManagementKit["connect"]>(),
    disconnect: jest.fn<DeviceManagementKit["disconnect"]>(),
    listenToAvailableDevices: jest.fn<DeviceManagementKit["listenToAvailableDevices"]>(),
    listenToConnectedDevice: jest.fn<DeviceManagementKit["listenToConnectedDevice"]>(),
    sendApdu: jest.fn<DeviceManagementKit["sendApdu"]>(),
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
    jest.restoreAllMocks();
  });

  describe("open", () => {
    it("should return the active transport", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionState = aMockedDeviceSessionState;
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        new Observable(subscriber => {
          subscriber.next(deviceSessionState);
        }),
      );
      const activeTransport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        transport: activeTransport,
      });
      const connectedDevice: ConnectedDevice = {
        id: "deviceId",
        type: "USB",
        sessionId: "sessionId",
        modelId: DeviceModelId.FLEX,
        name: "FLEX",
      };
      jest.mocked(mockDMK.getConnectedDevice).mockReturnValue(connectedDevice);

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

        jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
          new BehaviorSubject({
            ...aMockedDeviceSessionState,
            deviceStatus: DeviceStatus.CONNECTED,
          }).asObservable(),
        );
        const activeTransport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
        jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
          transport: activeTransport,
        });

        jest.mocked(mockDMK.getConnectedDevice).mockReturnValue({
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
        jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
          new BehaviorSubject({
            ...aMockedDeviceSessionState,
            deviceStatus: DeviceStatus.NOT_CONNECTED,
          }).asObservable(),
        );
        const activeTransport = new DeviceManagementKitHIDTransport(mockDMK, "sessionIdA");
        jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
          transport: activeTransport,
        });

        jest.mocked(mockDMK.getConnectedDevice).mockReturnValue({
          id: "deviceId",
          type: "USB",
          sessionId: "sessionId",
          modelId: DeviceModelId.FLEX,
          name: "FLEX",
        });

        const mockedDiscoveredDevice = createMockDiscoveredDevice();
        const mockedListenToAvailableDevices = jest.mocked(mockDMK.listenToAvailableDevices);
        mockedListenToAvailableDevices.mockReturnValue(
          new Observable(subscriber => {
            subscriber.next([mockedDiscoveredDevice]);
          }),
        );
        const mockedConnect = jest.mocked(mockDMK.connect);
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
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        new BehaviorSubject({
          ...aMockedDeviceSessionState,
          deviceStatus: DeviceStatus.NOT_CONNECTED,
        }).asObservable(),
      );
      jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);

      const mockedDiscoveredDevice = createMockDiscoveredDevice();
      const mockedListenToAvailableDevices = jest.mocked(mockDMK.listenToAvailableDevices);
      mockedListenToAvailableDevices.mockReturnValue(
        new Observable(subscriber => {
          subscriber.next([mockedDiscoveredDevice]);
        }),
      );
      const mockedConnect = jest.mocked(mockDMK.connect);
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

  describe("close", () => {
    it("should just resolve", async () => {
      const mockDMK = createMockDMK();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      await transport.close();
    });
  });

  describe("exchange", () => {
    it("should throw an error if no active session", async () => {
      // given
      const mockDMK = createMockDMK();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue(null);
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
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());

      const mockSendApdu = jest.mocked(mockDMK.sendApdu);
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
        transport,
      });
      jest.mocked(mockDMK.sendApdu).mockResolvedValue({
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
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const mockSendApdu = jest.mocked(mockDMK.sendApdu);
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
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
        jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
        const mockSendApdu = jest.mocked(mockDMK.sendApdu);
        const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
        jest.spyOn(activeDeviceSessionSubject, "getValue").mockReturnValue({
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
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      jest.spyOn(DeviceManagementKitHIDTransport.prototype, "listenToDisconnect");

      // when
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");

      // then
      expect(transport.listenToDisconnect).toHaveBeenCalled();
    });

    it("when the device gets disconnected, it should reset activeDeviceSession and emit disconnect", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDMK.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      jest.spyOn(activeDeviceSessionSubject, "next");
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(transport, "emit");

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
      jest
        .mocked(mockDMK.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      jest.spyOn(activeDeviceSessionSubject, "next");

      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(transport, "emit");

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
      jest
        .mocked(mockDMK.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      jest.spyOn(transport, "emit");

      // when
      deviceSessionStateSubject.complete();

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should emit disconnect on error", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDMK.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      jest.spyOn(transport, "emit");

      // when
      deviceSessionStateSubject.error(new Error("error"));

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
  });
});
