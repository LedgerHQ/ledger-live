import {
  TransportConnectedDevice,
  type SendApduFnType,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import {
  recordApduResult,
  recordApduSent,
  recordConnected,
  recordDisconnected,
} from "./bluetoothActivity";

const withApduRecording =
  (sendApdu: SendApduFnType): SendApduFnType =>
  async (apdu, triggersDisconnection, abortTimeout) => {
    recordApduSent();
    const result = await sendApdu(apdu, triggersDisconnection, abortTimeout);
    recordApduResult(result);
    return result;
  };

/** Wraps a transport so every connection, disconnection and APDU exchange feeds `bluetoothActivity$`. */
export const withBluetoothActivity =
  (factory: TransportFactory): TransportFactory =>
  args => {
    const transport = factory(args);
    return {
      getIdentifier: () => transport.getIdentifier(),
      isSupported: () => transport.isSupported(),
      startDiscovering: () => transport.startDiscovering(),
      stopDiscovering: () => transport.stopDiscovering(),
      listenToAvailableDevices: () => transport.listenToAvailableDevices(),
      connect: async params => {
        const result = await transport.connect({
          ...params,
          onDisconnect: disconnectedId => {
            recordDisconnected();
            params.onDisconnect(disconnectedId);
          },
        });
        return result.map(device => {
          recordConnected(device.name ?? device.id);
          return new TransportConnectedDevice({
            id: device.id,
            deviceModel: device.deviceModel,
            type: device.type,
            transport: device.transport,
            name: device.name,
            sendApdu: withApduRecording(device.sendApdu),
          });
        });
      },
      disconnect: async params => {
        const result = await transport.disconnect(params);
        if (result.isRight()) recordDisconnected();
        return result;
      },
    };
  };
