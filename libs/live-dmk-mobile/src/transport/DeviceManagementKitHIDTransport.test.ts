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
import { activeDeviceSessionRegistry } from "@ledgerhq/live-dmk-shared";

function createMockDMK(): DeviceManagementKit {
  const mock = {
    getDeviceSessionState: jest.fn(),
    getConnectedDevice: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    listenToAvailableDevices: jest.fn(),
    listenToConnectedDevice: jest.fn(),
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
    activeDeviceSessionRegistry.dispose();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    activeDeviceSessionRegistry.dispose();
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
      activeDeviceSessionRegistry.addSession({ sessionId: "sessionId", dmk: mockDMK });
      const connectedDevice: ConnectedDevice = {
        id: "deviceId",
        type: "USB",
        transport: rnHidTransportIdentifier,
        sessionId: "sessionId",
        modelId: DMKDeviceModelId.FLEX,
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
        activeDeviceSessionRegistry.addSession({ sessionId: "sessionId", dmk: mockDMK });

        jest.mocked(mockDMK.getConnectedDevice).mockReturnValue({
          id: "deviceId",
          type: "USB",
          transport: rnHidTransportIdentifier,
          sessionId: "sessionId",
          modelId: DMKDeviceModelId.FLEX,
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
        activeDeviceSessionRegistry.addSession({ sessionId: "sessionIdA", dmk: mockDMK });

        jest.mocked(mockDMK.getConnectedDevice).mockReturnValue({
          id: "deviceId",
          type: "USB",
          transport: rnHidTransportIdentifier,
          sessionId: "sessionId",
          modelId: DMKDeviceModelId.FLEX,
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
    it("should call dmk sendApdu with its own session without an active registry session", async () => {
      // given
      const mockDMK = createMockDMK();
      jest.mocked(mockDMK.getDeviceSessionState).mockReturnValue(new Observable());
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
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

  describe("registry disconnect bridge", () => {
    it("when the registry session is removed, it should emit disconnect", async () => {
      // given
      const mockDMK = createMockDMK();
      const deviceSessionStateSubject = new Subject<DeviceSessionState>();
      jest
        .mocked(mockDMK.getDeviceSessionState)
        .mockReturnValue(deviceSessionStateSubject.asObservable());
      activeDeviceSessionRegistry.addSession({ sessionId: "session", dmk: mockDMK });
      const transport = new DeviceManagementKitHIDTransport(mockDMK, "session");
      jest.spyOn(transport, "emit");

      // when
      activeDeviceSessionRegistry.removeSession("session");

      // then
      expect(transport.emit).toHaveBeenCalledWith("disconnect");
    });
  });
});
