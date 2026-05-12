import { BehaviorSubject, Observable, Subject } from "rxjs";
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
} from "./DeviceManagementKitHIDTransport";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { DisconnectedDevice } from "@ledgerhq/errors";

function createMockDMK(): DeviceManagementKit {
  const mock = {
    getDeviceSessionState: jest.fn(),
    getConnectedDevice: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    listenToAvailableDevices: jest.fn(),
    listenToConnectedDevice: jest.fn(),
    listConnectedDevices: jest.fn(),
    sendApdu: jest.fn(),
  };
  return mock as unknown as DeviceManagementKit;
}

const aMockedDeviceSessionState: DeviceSessionState = {
  deviceStatus: DeviceStatus.CONNECTED,
  sessionStateType: DeviceSessionStateType.Connected,
  deviceModelId: DMKDeviceModelId.FLEX,
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
    it("should return a transport for a reusable USB connected session", async () => {
      // given
      const mockDMK = createMockDMK();
      const connectedDevice: ConnectedDevice = {
        id: "deviceId",
        type: "USB",
        transport: rnHidTransportIdentifier,
        sessionId: "sessionId",
        modelId: DMKDeviceModelId.FLEX,
        name: "FLEX",
      };
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(
        new BehaviorSubject({
          ...aMockedDeviceSessionState,
          deviceStatus: DeviceStatus.CONNECTED,
        }).asObservable(),
      );
      jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([connectedDevice]);

      // when
      const transport = await DeviceManagementKitHIDTransport.open(
        "deviceId",
        undefined,
        undefined,
        mockDMK,
      );

      // then
      expect(transport).toBeInstanceOf(DeviceManagementKitHIDTransport);
      expect(transport.sessionId).toEqual("sessionId");
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

        jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([
          {
            id: "deviceId",
            type: "USB",
            transport: rnHidTransportIdentifier,
            sessionId: "sessionId",
            modelId: DMKDeviceModelId.FLEX,
            name: "FLEX",
          },
        ]);

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
        jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([]);

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
      jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([]);
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
    it("should call dmk sendApdu with its own session", async () => {
      // given
      const mockDMK = createMockDMK();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([
        {
          sessionId: "session",
        } as ConnectedDevice,
      ]);
      jest.mocked(mockDMK.sendApdu).mockResolvedValue({
        data: Uint8Array.from([]),
        statusCode: Uint8Array.from([0x90, 0x00]),
      });

      // when
      await transport.exchange(Buffer.from([]));

      // then
      expect(mockDMK.sendApdu).toHaveBeenCalledWith({
        sessionId: "session",
        apdu: Uint8Array.from([]),
        abortTimeout: undefined,
      });
    });

    it("should call dmk sendApdu and return response", async () => {
      // given
      const mockDMK = createMockDMK();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());

      const mockSendApdu = jest.mocked(mockDMK.sendApdu);
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([
        {
          sessionId: "session",
        } as ConnectedDevice,
      ]);
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
      jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([
        {
          sessionId: "session",
        } as ConnectedDevice,
      ]);
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
        jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([
          {
            sessionId: "session",
          } as ConnectedDevice,
        ]);
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

    it("should throw DisconnectedDevice if its own session is not connected anymore", async () => {
      // given
      const mockDMK = createMockDMK();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.mocked(mockDMK.listConnectedDevices).mockReturnValue([]);

      // when
      const result = transport.exchange(Buffer.from([]));

      // then
      await expect(result).rejects.toEqual(new DisconnectedDevice());
      expect(mockDMK.sendApdu).not.toHaveBeenCalled();
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

    it("should emit disconnect when the session becomes disconnected", () => {
      // given
      const mockDMK = createMockDMK();
      const sessionState = new Subject<DeviceSessionState>();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(sessionState.asObservable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(transport, "emit");

      // when
      sessionState.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      });

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should not emit disconnect when the device state changes to another state than NOT_CONNECTED", () => {
      // given
      const mockDMK = createMockDMK();
      const sessionState = new Subject<DeviceSessionState>();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(sessionState.asObservable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(transport, "emit");

      // when
      sessionState.next({
        ...aMockedDeviceSessionState,
        deviceStatus: DeviceStatus.BUSY,
      });

      // then
      expect(transport.emit).not.toHaveBeenCalled();
    });

    it("should emit disconnect on complete", () => {
      // given
      const mockDMK = createMockDMK();
      const sessionState = new Subject<DeviceSessionState>();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(sessionState.asObservable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      jest.spyOn(transport, "emit");

      // when
      sessionState.complete();

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });

    it("should emit disconnect on error", () => {
      // given
      const mockDMK = createMockDMK();
      const sessionState = new Subject<DeviceSessionState>();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(sessionState.asObservable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "sessionId");
      jest.spyOn(transport, "emit");

      // when
      sessionState.error(new Error("error"));

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
  });
});
