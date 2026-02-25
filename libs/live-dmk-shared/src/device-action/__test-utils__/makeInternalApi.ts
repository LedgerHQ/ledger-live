import { type InternalApi } from "@ledgerhq/device-management-kit";
const sendApduMock = jest.fn();
const sendCommandMock = jest.fn();
const apiGetDeviceModelMock = jest.fn();
const apiGetDeviceSessionStateMock = jest.fn();
const apiGetDeviceSessionStateObservableMock = jest.fn();
const setDeviceSessionStateMock = jest.fn();
const getManagerApiServiceMock = jest.fn();
const getSecureChannelServiceMock = jest.fn();
const _disableRefresherMock = jest.fn();

export function makeDeviceActionInternalApiMock(): jest.Mocked<InternalApi> {
  return {
    sendApdu: sendApduMock,
    sendCommand: sendCommandMock,
    getDeviceModel: apiGetDeviceModelMock,
    getDeviceSessionState: apiGetDeviceSessionStateMock,
    getDeviceSessionStateObservable: apiGetDeviceSessionStateObservableMock,
    setDeviceSessionState: setDeviceSessionStateMock,
    getManagerApiService: getManagerApiServiceMock,
    getSecureChannelService: getSecureChannelServiceMock,
  };
}
