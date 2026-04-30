import { afterEach, describe, expect, it } from "bun:test";
import {
  DeviceDisconnectedBeforeSendingApdu,
  type ApduReceiverServiceFactory,
  type ApduSenderServiceFactory,
  type DeviceConnectionStateMachine,
  type DeviceConnectionStateMachineParams,
  type DeviceModelDataSource,
  type DeviceId,
  type LoggerPublisherService,
  type TransportConnectedDevice,
} from "@ledgerhq/device-management-kit";
import { Right } from "purify-ts";
import type { Subscription } from "rxjs";
import { NodeWebUsbTransport } from "./NodeWebUsbTransport";
import type { NodeWebUsbApduSenderDependencies } from "./NodeWebUsbApduSender";

function flushTasks(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
}

async function waitFor(assertion: () => void, attempts = 20): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await flushTasks();
    }
  }

  throw lastError;
}

function createLogger(): LoggerPublisherService {
  return {
    subscribers: [],
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  } as unknown as LoggerPublisherService;
}

function createStubApduSender() {
  return {
    sendApdu: async () => Right(new Uint8Array()) as never,
    setupConnection: async () => {},
    closeConnection: async () => {},
    getDependencies: () => ({}) as NodeWebUsbApduSenderDependencies,
    setDependencies: () => {},
  };
}

describe("NodeWebUsbTransport", () => {
  let subscriptions: Subscription[] = [];

  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
    subscriptions = [];
  });

  it("refreshes discovered devices from the Windows polling fallback when hotplug attach is missed", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let currentDeviceList: (typeof nativeDevice)[] = [];
    let pollCallback: (() => void) | undefined;
    let clearedInterval: ReturnType<typeof globalThis.setInterval> | null = null;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      undefined,
      undefined,
      {
        platform: "win32",
        getDeviceList: () => currentDeviceList as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          pollCallback = callback;
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: handle => {
          clearedInterval = handle;
        },
      },
    );

    const emissions: Array<{ id: string; transport: string }> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(...devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await flushTasks();
    expect(emissions).toHaveLength(0);
    expect(pollCallback).toBeDefined();

    currentDeviceList = [nativeDevice];
    pollCallback?.();
    await waitFor(() => {
      expect(emissions).toHaveLength(1);
    });
    expect(emissions[0]?.transport).toBe("NODE-WEBUSB");
    expect(typeof emissions[0]?.id).toBe("string");

    transport.destroy();
    expect(clearedInterval).not.toBeNull();
  });

  it("restarts Windows discovery polling when the connection state machine asks to reconnect", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let currentDeviceList: (typeof nativeDevice)[] = [nativeDevice];
    let nextHandle = 0;
    let activePollCallback: (() => void) | undefined;
    const intervalHandles: number[] = [];
    const clearedHandles: number[] = [];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {},
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      {
        platform: "win32",
        getDeviceList: () => currentDeviceList as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          nextHandle += 1;
          intervalHandles.push(nextHandle);
          activePollCallback = callback;
          return nextHandle as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: handle => {
          clearedHandles.push(handle as unknown as number);
        },
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });
    expect(tryToReconnect).toBeUndefined();
    expect(intervalHandles).toEqual([1]);
    expect(clearedHandles).toEqual([1]);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    expect(tryToReconnect).toBeDefined();

    currentDeviceList = [];
    tryToReconnect?.(0);
    await waitFor(() => {
      expect(intervalHandles).toEqual([1, 2]);
      expect(activePollCallback).toBeDefined();
    });

    activePollCallback?.();
    await waitFor(() => {
      expect(emissions.at(-1)).toEqual([]);
    });

    transport.destroy();
    expect(clearedHandles).toContain(2);
  });

  it("reconnects a pending machine from a rescan even if attach arrived before pending mode", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let currentDeviceList: (typeof nativeDevice)[] = [nativeDevice];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      {
        platform: "win32",
        getDeviceList: () => currentDeviceList as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          queueMicrotask(callback);
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: () => {},
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    expect(setupConnectionCalls).toBe(1);
    expect(tryToReconnect).toBeDefined();

    tryToReconnect?.(0);
    await waitFor(() => {
      expect(setupConnectionCalls).toBe(2);
      expect(eventDeviceConnectedCalls).toBe(1);
    });

    transport.destroy();
  });

  it("keeps a machine pending when an early reconnect attempt fails before a later scan succeeds", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let currentDeviceList: (typeof nativeDevice)[] = [nativeDevice];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let closeConnectionCalls = 0;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
            if (setupConnectionCalls === 2) {
              throw new Error("LIBUSB_ERROR_NO_DEVICE");
            }
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {
            closeConnectionCalls += 1;
          },
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      {
        platform: "win32",
        getDeviceList: () => currentDeviceList as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          queueMicrotask(callback);
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: () => {},
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    tryToReconnect?.(0);

    await waitFor(() => {
      expect(setupConnectionCalls).toBe(2);
    });
    expect(eventDeviceConnectedCalls).toBe(0);
    expect(closeConnectionCalls).toBe(0);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await transport.updateTransportDiscoveredDevices();
      if (setupConnectionCalls === 3) break;
      await flushTasks();
    }
    await waitFor(() => {
      expect(setupConnectionCalls).toBe(3);
      expect(eventDeviceConnectedCalls).toBe(1);
    });

    expect(closeConnectionCalls).toBe(0);

    transport.destroy();
  });

  it("serializes APDU calls sent through the same connected device", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let connectedDeviceId: DeviceId | undefined;
    let sendApduCalls = 0;
    let resolveFirstApdu: (() => void) | undefined;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params =>
        ({
          setupConnection: async () => {},
          sendApdu: async () => {
            sendApduCalls += 1;
            if (sendApduCalls === 1) {
              await new Promise<void>(resolve => {
                resolveFirstApdu = resolve;
              });
            }
            return Right({
              data: new Uint8Array(),
              statusCode: new Uint8Array([0x90, 0x00]),
            }) as never;
          },
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {},
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      {
        platform: "win32",
        getDeviceList: () => [nativeDevice] as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          queueMicrotask(callback);
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: () => {},
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    let connectedDevice: TransportConnectedDevice | undefined;
    connectResult.ifRight(device => {
      connectedDevice = device;
    });
    expect(connectedDevice).toBeDefined();

    const firstApdu = connectedDevice!.sendApdu(new Uint8Array([0xb0, 0x01]));
    const secondApdu = connectedDevice!.sendApdu(new Uint8Array([0xb0, 0x01]));

    await waitFor(() => {
      expect(sendApduCalls).toBe(1);
      expect(resolveFirstApdu).toBeDefined();
    });
    await flushTasks();
    expect(sendApduCalls).toBe(1);

    resolveFirstApdu?.();
    await Promise.all([firstApdu, secondApdu]);

    expect(sendApduCalls).toBe(2);

    transport.destroy();
  });

  it("creates a fresh connection state machine after disconnecting a session", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let closeConnectionCalls = 0;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params =>
        ({
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {
            closeConnectionCalls += 1;
            params.onTerminated();
          },
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      {
        platform: "win32",
        getDeviceList: () => [nativeDevice] as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          queueMicrotask(callback);
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: () => {},
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });

    const onDisconnectCalls: DeviceId[] = [];
    const firstConnect = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: id => {
        onDisconnectCalls.push(id);
      },
    });
    let connectedDevice: TransportConnectedDevice | undefined;
    firstConnect.ifRight(device => {
      connectedDevice = device;
    });
    expect(connectedDevice).toBeDefined();
    expect(setupConnectionCalls).toBe(1);

    await transport.disconnect({ connectedDevice: connectedDevice! });
    expect(closeConnectionCalls).toBe(1);
    expect(onDisconnectCalls).toEqual([connectedDeviceId!]);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    expect(setupConnectionCalls).toBe(2);

    transport.destroy();
  });

  it("rejects sendApdu with DeviceDisconnectedBeforeSendingApdu after the machine is unrouted", async () => {
    const nativeDevice = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDevice = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-1",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    let connectedDeviceId: DeviceId | undefined;
    let machineSendApduCalls = 0;

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params =>
        ({
          setupConnection: async () => {},
          sendApdu: async () => {
            machineSendApduCalls += 1;
            return Right({
              data: new Uint8Array(),
              statusCode: new Uint8Array([0x90, 0x00]),
            }) as never;
          },
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {
            params.onTerminated();
          },
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      {
        platform: "win32",
        getDeviceList: () => [nativeDevice] as never[],
        createWebUsbDevice: async () => webUsbDevice as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          queueMicrotask(callback);
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: () => {},
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    let connectedDevice: TransportConnectedDevice | undefined;
    connectResult.ifRight(device => {
      connectedDevice = device;
    });
    expect(connectedDevice).toBeDefined();

    await transport.disconnect({ connectedDevice: connectedDevice! });

    const callsBefore = machineSendApduCalls;
    const result = await connectedDevice!.sendApdu(new Uint8Array([0xb0, 0x01]));

    expect(machineSendApduCalls).toBe(callsBefore);
    let leftError: unknown;
    result.ifLeft(error => {
      leftError = error;
    });
    expect(leftError).toBeInstanceOf(DeviceDisconnectedBeforeSendingApdu);

    transport.destroy();
  });

  it("isolates onDisconnect callbacks and APDU routing per connected device", async () => {
    const nativeDeviceA = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const nativeDeviceB = {
      deviceDescriptor: {
        idVendor: 0x2c97,
        idProduct: 0x5011,
      },
    };
    const webUsbDeviceA = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-A",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };
    const webUsbDeviceB = {
      vendorId: 0x2c97,
      productId: 0x5011,
      serialNumber: "ledger-B",
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 255 }],
            },
          ],
        },
      ],
    };

    const nativeToWeb = new Map<unknown, unknown>([
      [nativeDeviceA, webUsbDeviceA],
      [nativeDeviceB, webUsbDeviceB],
    ]);

    const machineSendApduCounts = new Map<DeviceId, number>();

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "nanoSP",
            productName: "Ledger Nano S Plus",
            usbProductId: 0x50,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as DeviceModelDataSource,
      () => createLogger(),
      (() => {
        throw new Error("unused apdu sender factory");
      }) as ApduSenderServiceFactory,
      (() => {
        throw new Error("unused apdu receiver factory");
      }) as ApduReceiverServiceFactory,
      params => {
        let dependencies: NodeWebUsbApduSenderDependencies = {
          device: webUsbDeviceA as never,
          interfaceNumber: 1,
        };
        return {
          setupConnection: async () => {},
          sendApdu: async () => {
            machineSendApduCounts.set(
              params.deviceId,
              (machineSendApduCounts.get(params.deviceId) ?? 0) + 1,
            );
            return Right({
              data: new Uint8Array(),
              statusCode: new Uint8Array([0x90, 0x00]),
            }) as never;
          },
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            dependencies = next;
          },
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {
            params.onTerminated();
          },
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      {
        platform: "linux",
        getDeviceList: () => [nativeDeviceA, nativeDeviceB] as never[],
        createWebUsbDevice: async native => nativeToWeb.get(native) as never,
        usbBindings: {
          on: () => {},
          removeListener: () => {},
          unrefHotplugEvents: () => {},
        },
        setInterval: callback => {
          queueMicrotask(callback);
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: () => {},
      },
    );

    const emissions: Array<Array<{ id: string; transport: string }>> = [];
    subscriptions.push(
      transport.listenToAvailableDevices().subscribe(devices => {
        emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
      }),
    );

    let deviceIdA: DeviceId | undefined;
    let deviceIdB: DeviceId | undefined;
    await waitFor(() => {
      const last = emissions.at(-1) ?? [];
      expect(last).toHaveLength(2);
      [deviceIdA, deviceIdB] = [last[0]!.id, last[1]!.id];
    });

    const onDisconnectA: DeviceId[] = [];
    const onDisconnectB: DeviceId[] = [];

    const connectA = await transport.connect({
      deviceId: deviceIdA!,
      onDisconnect: id => onDisconnectA.push(id),
    });
    let connectedA: TransportConnectedDevice | undefined;
    connectA.ifRight(d => {
      connectedA = d;
    });

    const connectB = await transport.connect({
      deviceId: deviceIdB!,
      onDisconnect: id => onDisconnectB.push(id),
    });
    let connectedB: TransportConnectedDevice | undefined;
    connectB.ifRight(d => {
      connectedB = d;
    });

    expect(connectedA).toBeDefined();
    expect(connectedB).toBeDefined();

    await transport.disconnect({ connectedDevice: connectedA! });

    expect(onDisconnectA).toEqual([deviceIdA!]);
    expect(onDisconnectB).toEqual([]);

    const apduOnB = await connectedB!.sendApdu(new Uint8Array([0xb0, 0x01]));
    expect(apduOnB.isRight()).toBe(true);
    expect(machineSendApduCounts.get(deviceIdB!)).toBe(1);
    expect(machineSendApduCounts.get(deviceIdA!) ?? 0).toBe(0);

    transport.destroy();
  });
});
