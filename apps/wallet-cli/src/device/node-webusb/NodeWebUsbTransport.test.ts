import { afterEach, describe, expect, it } from "bun:test";
import {
  DeviceDisconnectedBeforeSendingApdu,
  NoAccessibleDeviceError,
  OpeningConnectionError,
  UnknownDeviceError,
  type ApduReceiverServiceFactory,
  type ApduSenderServiceFactory,
  type DeviceConnectionStateMachine,
  type DeviceConnectionStateMachineParams,
  type DeviceModelDataSource,
  type DeviceId,
  type LoggerPublisherService,
  type TransportConnectedDevice,
  type TransportArgs,
} from "@ledgerhq/device-management-kit";
import { Right } from "purify-ts";
import { firstValueFrom, type Subscription } from "rxjs";
import { NodeWebUsbTransport, nodeWebUsbTransportFactory } from "./NodeWebUsbTransport";
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

function createRecordingLogger(records: {
  errors: unknown[];
  warnings: unknown[];
}): LoggerPublisherService {
  return {
    subscribers: [],
    debug: () => {},
    info: () => {},
    warn: (...args: unknown[]) => {
      records.warnings.push(args);
    },
    error: (...args: unknown[]) => {
      records.errors.push(args);
    },
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

let subscriptions: Subscription[] = [];

type WebUsbLedgerDevice = {
  vendorId: number;
  productId: number;
  serialNumber: string;
  configurations: Array<{
    interfaces: Array<{
      interfaceNumber: number;
      alternates: Array<{ interfaceClass: number }>;
    }>;
  }>;
};

type TestPlatformBindings = NonNullable<ConstructorParameters<typeof NodeWebUsbTransport>[6]>;
type HotplugListenerProbe = { startListeningToConnectionEvents: () => void };
type UsbConnectionListener = (event: { device: WebUsbLedgerDevice }) => void;

function createWebUsbLedgerDevice(serialNumber = "ledger-1"): WebUsbLedgerDevice {
  return {
    vendorId: 0x2c97,
    productId: 0x5011,
    serialNumber,
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
}

function createLedgerModelDataSource(): DeviceModelDataSource {
  return {
    getAllDeviceModels: () => [
      {
        id: "nanoSP",
        productName: "Ledger Nano S Plus",
        usbProductId: 0x50,
        bootloaderUsbProductId: 0x5011,
      },
    ],
  } as DeviceModelDataSource;
}

function createUnusedApduSenderFactory(): ApduSenderServiceFactory {
  return (() => {
    throw new Error("unused apdu sender factory");
  }) as ApduSenderServiceFactory;
}

function createUnusedApduReceiverFactory(): ApduReceiverServiceFactory {
  return (() => {
    throw new Error("unused apdu receiver factory");
  }) as ApduReceiverServiceFactory;
}

function createPlatformBindings({
  getDevices = async () => [],
  ...overrides
}: Partial<TestPlatformBindings> & {
  getDevices?: TestPlatformBindings["usb"]["getDevices"];
}): TestPlatformBindings {
  return {
    platform: "win32",
    usb: {
      getDevices,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    setInterval: callback => {
      queueMicrotask(callback);
      return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
    },
    clearInterval: () => {},
    ...overrides,
  };
}

function createTestTransport(
  deviceConnectionStateMachineFactory?: ConstructorParameters<typeof NodeWebUsbTransport>[4],
  deviceApduSenderFactory?: ConstructorParameters<typeof NodeWebUsbTransport>[5],
  platformBindings?: TestPlatformBindings,
): NodeWebUsbTransport {
  return new NodeWebUsbTransport(
    createLedgerModelDataSource(),
    () => createLogger(),
    createUnusedApduSenderFactory(),
    createUnusedApduReceiverFactory(),
    deviceConnectionStateMachineFactory,
    deviceApduSenderFactory,
    platformBindings,
  );
}

function collectDeviceEmissions(
  transport: NodeWebUsbTransport,
): Array<Array<{ id: string; transport: string }>> {
  const emissions: Array<Array<{ id: string; transport: string }>> = [];
  subscriptions.push(
    transport.listenToAvailableDevices().subscribe(devices => {
      emissions.push(devices.map(device => ({ id: device.id, transport: device.transport })));
    }),
  );
  return emissions;
}

async function waitForFirstDeviceId(
  emissions: Array<Array<{ id: string; transport: string }>>,
): Promise<DeviceId> {
  let connectedDeviceId: DeviceId | undefined;
  await waitFor(() => {
    connectedDeviceId = emissions.at(-1)?.[0]?.id;
    expect(connectedDeviceId).toBeDefined();
  });
  return connectedDeviceId!;
}

function unwrapConnectedDevice(
  connectResult: Awaited<ReturnType<NodeWebUsbTransport["connect"]>>,
): TransportConnectedDevice {
  let connectedDevice: TransportConnectedDevice | undefined;
  connectResult.ifRight(device => {
    connectedDevice = device;
  });
  expect(connectedDevice).toBeDefined();
  return connectedDevice!;
}

describe("NodeWebUsbTransport", () => {
  afterEach(() => {
    subscriptions.forEach(subscription => subscription.unsubscribe());
    subscriptions = [];
  });

  it("refreshes discovered devices from the Windows polling fallback when hotplug attach is missed", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let currentDeviceList: WebUsbLedgerDevice[] = [];
    let pollCallback: (() => void) | undefined;
    let clearedInterval: ReturnType<typeof globalThis.setInterval> | null = null;

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => currentDeviceList as never[],
        setInterval: callback => {
          pollCallback = callback;
          return 0 as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: handle => {
          clearedInterval = handle;
        },
      }),
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

    currentDeviceList = [webUsbDevice];
    pollCallback?.();
    await waitFor(() => {
      expect(emissions).toHaveLength(1);
    });
    expect(emissions[0]?.transport).toBe("NODE-WEBUSB");
    expect(typeof emissions[0]?.id).toBe("string");

    await transport.destroy();
    expect(clearedInterval).not.toBeNull();
  });

  it("restarts Windows discovery polling when the connection state machine asks to reconnect", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let currentDeviceList: WebUsbLedgerDevice[] = [webUsbDevice];
    let nextHandle = 0;
    let activePollCallback: (() => void) | undefined;
    const intervalHandles: number[] = [];
    const clearedHandles: number[] = [];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;

    const transport = createTestTransport(
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
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => currentDeviceList as never[],
        setInterval: callback => {
          nextHandle += 1;
          intervalHandles.push(nextHandle);
          activePollCallback = callback;
          return nextHandle as unknown as ReturnType<typeof globalThis.setInterval>;
        },
        clearInterval: handle => {
          clearedHandles.push(handle as unknown as number);
        },
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);
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

    await transport.destroy();
    expect(clearedHandles).toContain(2);
  });

  it("reconnects a pending machine from a rescan even if attach arrived before pending mode", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let currentDeviceList: WebUsbLedgerDevice[] = [webUsbDevice];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;

    const transport = createTestTransport(
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
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => currentDeviceList as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

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

    await transport.destroy();
  });

  it("keeps a machine pending when an early reconnect attempt fails before a later scan succeeds", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let currentDeviceList: WebUsbLedgerDevice[] = [webUsbDevice];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let closeConnectionCalls = 0;

    const transport = createTestTransport(
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
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => currentDeviceList as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

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

    await transport.destroy();
  });

  it("keeps a machine pending and not active when eventDeviceConnected throws during reconnection", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    const currentDeviceList: WebUsbLedgerDevice[] = [webUsbDevice];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let eventDeviceDisconnectedCalls = 0;
    let closeConnectionCalls = 0;

    const transport = createTestTransport(
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
          eventDeviceDisconnected: () => {
            eventDeviceDisconnectedCalls += 1;
          },
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
            // eventDeviceConnected is only invoked from the reconnect path —
            // configure it to always fail to keep the machine pending and
            // expose any leak into the active map.
            throw new Error("state machine refused connected event");
          },
          closeConnection: () => {
            closeConnectionCalls += 1;
          },
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => currentDeviceList as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const connected = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    expect(setupConnectionCalls).toBe(1);
    expect(eventDeviceConnectedCalls).toBe(0);
    expect(tryToReconnect).toBeDefined();
    expect(connected.isRight()).toBe(true);

    // Trigger pending reconnection. handleDeviceReconnection will run
    // setupConnection (success) then eventDeviceConnected (throws).
    tryToReconnect?.(0);

    await waitFor(() => {
      expect(setupConnectionCalls).toBe(2);
      expect(eventDeviceConnectedCalls).toBe(1);
    });

    // After the failed publish, the machine must NOT remain in the active
    // device-by-webusb map. We probe that map externally via a detach event:
    // handleDeviceDisconnection iterates _deviceConnectionsByWebUsbDevice and
    // would call eventDeviceDisconnected on any entry it finds. With the leak,
    // the broken machine would still be there and would receive the event;
    // with the fix it has been removed and the detach is a no-op.
    await transport.handleDeviceDisconnection(webUsbDevice as never);
    expect(eventDeviceDisconnectedCalls).toBe(0);

    // The machine was never closed: the reconnect path should leave it
    // recoverable rather than tearing it down on a transient failure.
    expect(closeConnectionCalls).toBe(0);

    await transport.destroy();
  });

  it("keeps a machine routable when rollback removes only one of several WebUSB keys", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("ledger-original");
    const replacementWebUsbDevice = createWebUsbLedgerDevice("ledger-replacement");

    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let machineSendApduCalls = 0;
    let dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };
    let machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies> | undefined;

    const transport = createTestTransport(
      params => {
        machine = {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => {
            machineSendApduCalls += 1;
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
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
            throw new Error("state machine refused connected event");
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
        return machine;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [originalWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(connectResult);
    expect(machine).toBeDefined();
    expect(setupConnectionCalls).toBe(1);

    await transport.handleDeviceReconnection(machine!, replacementWebUsbDevice as never, 1);

    expect(setupConnectionCalls).toBe(2);
    expect(eventDeviceConnectedCalls).toBe(1);
    expect(dependencies.device).toBe(originalWebUsbDevice as never);

    const apduResult = await connectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));
    expect(apduResult.isRight()).toBe(true);
    expect(machineSendApduCalls).toBe(1);

    await transport.destroy();
  });

  it("reuses one in-flight connection state machine for concurrent connects to the same device", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let releaseSetup: (() => void) | undefined;
    const setupGate = new Promise<void>(resolve => {
      releaseSetup = resolve;
    });
    let machineFactoryCalls = 0;
    let setupConnectionCalls = 0;
    let machineSendApduCalls = 0;

    const transport = createTestTransport(
      params => {
        machineFactoryCalls += 1;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
            await setupGate;
          },
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
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const firstConnect = transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    const secondConnect = transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    await waitFor(() => {
      expect(setupConnectionCalls).toBeGreaterThan(0);
    });
    releaseSetup?.();

    const [firstResult, secondResult] = await Promise.all([firstConnect, secondConnect]);
    const firstConnectedDevice = unwrapConnectedDevice(firstResult);
    const secondConnectedDevice = unwrapConnectedDevice(secondResult);

    expect(machineFactoryCalls).toBe(1);
    expect(setupConnectionCalls).toBe(1);

    await Promise.all([
      firstConnectedDevice.sendApdu(new Uint8Array([0xb0, 0x01])),
      secondConnectedDevice.sendApdu(new Uint8Array([0xb0, 0x02])),
    ]);
    expect(machineSendApduCalls).toBe(2);

    await transport.destroy();
  });

  it("ignores attach and detach events while an explicit disconnect is closing USB resources", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let releaseUsbClose: (() => void) | undefined;
    const usbCloseGate = new Promise<void>(resolve => {
      releaseUsbClose = resolve;
    });
    let getDevicesCalls = 0;
    let eventDeviceDisconnectedCalls = 0;
    let machineCloseConnectionCalls = 0;

    const transport = createTestTransport(
      params =>
        ({
          setupConnection: async () => {},
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {
            eventDeviceDisconnectedCalls += 1;
          },
          eventDeviceConnected: () => {},
          closeConnection: () => {
            machineCloseConnectionCalls += 1;
          },
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () =>
        ({
          ...createStubApduSender(),
          closeConnection: async () => {
            await usbCloseGate;
          },
        }) as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => {
          getDevicesCalls += 1;
          return [webUsbDevice] as never[];
        },
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);
    expect(getDevicesCalls).toBe(1);

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(connectResult);

    const disconnectPromise = transport.disconnect({ connectedDevice });
    await waitFor(() => {
      expect(machineCloseConnectionCalls).toBe(1);
    });

    await transport.handleDeviceDisconnection(webUsbDevice as never);
    await transport.handleDeviceConnection(webUsbDevice as never);

    expect(eventDeviceDisconnectedCalls).toBe(0);
    expect(getDevicesCalls).toBe(1);

    releaseUsbClose?.();
    await disconnectPromise;
    await transport.destroy();
  });

  it("cleans up a failed initial connect and allows a later connect to succeed", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceDisconnectedCalls = 0;
    let machineSendApduCalls = 0;

    const transport = createTestTransport(
      params =>
        ({
          setupConnection: async () => {
            setupConnectionCalls += 1;
            if (setupConnectionCalls === 1) {
              throw new Error("LIBUSB_ERROR_ACCESS");
            }
          },
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
          eventDeviceDisconnected: () => {
            eventDeviceDisconnectedCalls += 1;
          },
          eventDeviceConnected: () => {},
          closeConnection: () => {},
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const firstConnect = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    let firstConnectError: unknown;
    firstConnect.ifLeft(error => {
      firstConnectError = error;
    });
    expect(firstConnectError).toBeInstanceOf(OpeningConnectionError);

    await transport.handleDeviceDisconnection(webUsbDevice as never);
    expect(eventDeviceDisconnectedCalls).toBe(0);
    expect(machineSendApduCalls).toBe(0);

    const secondConnect = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(secondConnect);

    expect(setupConnectionCalls).toBe(2);
    const apduResult = await connectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));
    expect(apduResult.isRight()).toBe(true);
    expect(machineSendApduCalls).toBe(1);

    await transport.destroy();
  });

  it("ignores non-Ledger attach and detach events", async () => {
    const nonLedgerDevice = {
      ...createWebUsbLedgerDevice(),
      vendorId: 0x1234,
      productId: 0x5678,
    };

    let getDevicesCalls = 0;

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => {
          getDevicesCalls += 1;
          return [];
        },
      }),
    );

    await transport.handleDeviceConnection(nonLedgerDevice as never);
    await transport.handleDeviceDisconnection(nonLedgerDevice as never);

    expect(getDevicesCalls).toBe(0);

    await transport.destroy();
  });

  it("ignores unmatched Ledger detach events", async () => {
    const unmatchedDevice = { ...createWebUsbLedgerDevice(), productId: 0x9999 };
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let eventDeviceDisconnectedCalls = 0;

    const transport = createTestTransport(
      params =>
        ({
          setupConnection: async () => {},
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {
            eventDeviceDisconnectedCalls += 1;
          },
          eventDeviceConnected: () => {},
          closeConnection: () => {},
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    await transport.handleDeviceDisconnection(unmatchedDevice as never);

    expect(eventDeviceDisconnectedCalls).toBe(0);

    await transport.destroy();
  });

  it("notifies the matching state machine on Ledger detach and swallows notification errors", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let eventDeviceDisconnectedCalls = 0;

    const transport = createTestTransport(
      params =>
        ({
          setupConnection: async () => {},
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {
            eventDeviceDisconnectedCalls += 1;
            throw new Error("state machine refused disconnected event");
          },
          eventDeviceConnected: () => {},
          closeConnection: () => {},
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });

    await transport.handleDeviceDisconnection(webUsbDevice as never);

    expect(eventDeviceDisconnectedCalls).toBe(1);

    await transport.destroy();
  });

  it("reconnects a pending machine only when both serial numbers match", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("ledger-A");
    const differentSerialWebUsbDevice = createWebUsbLedgerDevice("ledger-B");

    let currentWebUsbDevice = originalWebUsbDevice;
    let connectedDeviceId: DeviceId | undefined;
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };

    const transport = createTestTransport(
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            dependencies = next;
          },
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [currentWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    expect(setupConnectionCalls).toBe(1);

    currentWebUsbDevice = differentSerialWebUsbDevice;
    tryToReconnect?.(0);
    await flushTasks();
    await transport.updateTransportDiscoveredDevices();

    expect(setupConnectionCalls).toBe(1);
    expect(eventDeviceConnectedCalls).toBe(0);

    currentWebUsbDevice = createWebUsbLedgerDevice("ledger-A");
    await transport.updateTransportDiscoveredDevices();

    expect(setupConnectionCalls).toBe(2);
    expect(eventDeviceConnectedCalls).toBe(1);

    await transport.destroy();
  });

  it("reconnects a pending machine by product when serial numbers are absent", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("");
    const replacementWebUsbDevice = createWebUsbLedgerDevice("");

    let currentWebUsbDevice = originalWebUsbDevice;
    let connectedDeviceId: DeviceId | undefined;
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };

    const transport = createTestTransport(
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            dependencies = next;
          },
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [currentWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    expect(setupConnectionCalls).toBe(1);

    currentWebUsbDevice = replacementWebUsbDevice;
    tryToReconnect?.(0);

    await waitFor(() => {
      expect(setupConnectionCalls).toBe(2);
      expect(eventDeviceConnectedCalls).toBe(1);
    });

    await transport.destroy();
  });

  it("reconnects a pending machine by product when only the previous device has a serial number", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("ledger-A");
    const replacementWebUsbDevice = createWebUsbLedgerDevice("");

    let currentWebUsbDevice = originalWebUsbDevice;
    let connectedDeviceId: DeviceId | undefined;
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };

    const transport = createTestTransport(
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            dependencies = next;
          },
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [currentWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    expect(setupConnectionCalls).toBe(1);

    currentWebUsbDevice = replacementWebUsbDevice;
    tryToReconnect?.(0);

    await waitFor(() => {
      expect(setupConnectionCalls).toBe(2);
      expect(eventDeviceConnectedCalls).toBe(1);
    });

    await transport.destroy();
  });

  it("reconnects a pending machine by product when only the replacement device has a serial number", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("");
    const replacementWebUsbDevice = createWebUsbLedgerDevice("ledger-A");

    let currentWebUsbDevice = originalWebUsbDevice;
    let connectedDeviceId: DeviceId | undefined;
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };

    const transport = createTestTransport(
      params => {
        tryToReconnect = params.tryToReconnect;

        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            dependencies = next;
          },
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [currentWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    expect(setupConnectionCalls).toBe(1);

    currentWebUsbDevice = replacementWebUsbDevice;
    tryToReconnect?.(0);

    await waitFor(() => {
      expect(setupConnectionCalls).toBe(2);
      expect(eventDeviceConnectedCalls).toBe(1);
    });

    await transport.destroy();
  });

  it("routes tryToReconnect and onTerminated only to machines with the matching deviceId", async () => {
    const webUsbDeviceA = createWebUsbLedgerDevice("ledger-A");
    const webUsbDeviceB = createWebUsbLedgerDevice("ledger-B");

    let deviceIdA: DeviceId | undefined;
    let deviceIdB: DeviceId | undefined;
    const tryToReconnectByDeviceId = new Map<
      DeviceId,
      NonNullable<
        DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      >
    >();
    const onTerminatedByDeviceId = new Map<DeviceId, () => void>();
    const eventDeviceConnectedCounts = new Map<DeviceId, number>();
    const machineSendApduCounts = new Map<DeviceId, number>();

    const transport = createTestTransport(
      params => {
        const webUsbDevice = params.deviceId === deviceIdA ? webUsbDeviceA : webUsbDeviceB;
        tryToReconnectByDeviceId.set(params.deviceId, params.tryToReconnect);
        onTerminatedByDeviceId.set(params.deviceId, params.onTerminated);

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
          getDependencies: () => ({
            device: webUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCounts.set(
              params.deviceId,
              (eventDeviceConnectedCounts.get(params.deviceId) ?? 0) + 1,
            );
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceA, webUsbDeviceB] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    await waitFor(() => {
      const last = emissions.at(-1) ?? [];
      expect(last).toHaveLength(2);
      [deviceIdA, deviceIdB] = [last[0]!.id, last[1]!.id];
    });

    const onDisconnectA: DeviceId[] = [];
    const onDisconnectB: DeviceId[] = [];
    await transport.connect({
      deviceId: deviceIdA!,
      onDisconnect: id => onDisconnectA.push(id),
    });
    const connectB = await transport.connect({
      deviceId: deviceIdB!,
      onDisconnect: id => onDisconnectB.push(id),
    });
    const connectedB = unwrapConnectedDevice(connectB);

    tryToReconnectByDeviceId.get(deviceIdA!)?.(0);
    await waitFor(() => {
      expect(eventDeviceConnectedCounts.get(deviceIdA!) ?? 0).toBe(1);
    });
    expect(eventDeviceConnectedCounts.get(deviceIdB!) ?? 0).toBe(0);

    const apduOnB = await connectedB.sendApdu(new Uint8Array([0xb0, 0x01]));
    expect(apduOnB.isRight()).toBe(true);
    expect(machineSendApduCounts.get(deviceIdB!) ?? 0).toBe(1);

    onTerminatedByDeviceId.get(deviceIdA!)?.();
    expect(onDisconnectA).toEqual([deviceIdA!]);
    expect(onDisconnectB).toEqual([]);

    await transport.destroy();
  });

  it("serializes APDU calls sent through the same connected device", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let sendApduCalls = 0;
    let resolveFirstApdu: (() => void) | undefined;

    const transport = createTestTransport(
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
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(connectResult);

    const firstApdu = connectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));
    const secondApdu = connectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));

    await waitFor(() => {
      expect(sendApduCalls).toBe(1);
      expect(resolveFirstApdu).toBeDefined();
    });
    await flushTasks();
    expect(sendApduCalls).toBe(1);

    resolveFirstApdu?.();
    await Promise.all([firstApdu, secondApdu]);

    expect(sendApduCalls).toBe(2);

    await transport.destroy();
  });

  it("creates a fresh connection state machine after disconnecting a session", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let machineCloseConnectionCalls = 0;
    let usbCloseConnectionCalls = 0;
    let usbCloseCompleted = false;
    let releaseUsbClose: (() => void) | undefined;
    const usbCloseGate = new Promise<void>(resolve => {
      releaseUsbClose = resolve;
    });
    let usbClosePromise: Promise<void> | null = null;

    const transport = createTestTransport(
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
            machineCloseConnectionCalls += 1;
            params.onTerminated();
          },
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () =>
        ({
          ...createStubApduSender(),
          closeConnection: () => {
            usbClosePromise ??= (async () => {
              usbCloseConnectionCalls += 1;
              await usbCloseGate;
              usbCloseCompleted = true;
            })();
            return usbClosePromise;
          },
        }) as never,
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const onDisconnectCalls: DeviceId[] = [];
    const firstConnect = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: id => {
        onDisconnectCalls.push(id);
      },
    });
    const connectedDevice = unwrapConnectedDevice(firstConnect);
    expect(setupConnectionCalls).toBe(1);

    const disconnectPromise = transport.disconnect({ connectedDevice });
    await flushTasks();
    expect(machineCloseConnectionCalls).toBe(1);
    expect(usbCloseConnectionCalls).toBe(1);
    expect(onDisconnectCalls).toEqual([connectedDeviceId!]);
    expect(usbCloseCompleted).toBe(false);

    releaseUsbClose?.();
    await disconnectPromise;
    expect(usbCloseCompleted).toBe(true);

    await waitFor(() => {
      connectedDeviceId = emissions.at(-1)?.[0]?.id;
      expect(connectedDeviceId).toBeDefined();
    });

    await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    expect(setupConnectionCalls).toBe(2);

    await transport.destroy();
  });

  it("rejects sendApdu with DeviceDisconnectedBeforeSendingApdu after the machine is unrouted", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let machineSendApduCalls = 0;

    const transport = createTestTransport(
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
      createPlatformBindings({
        platform: "win32",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId!,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(connectResult);

    await transport.disconnect({ connectedDevice });

    const callsBefore = machineSendApduCalls;
    const result = await connectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));

    expect(machineSendApduCalls).toBe(callsBefore);
    let leftError: unknown;
    result.ifLeft(error => {
      leftError = error;
    });
    expect(leftError).toBeInstanceOf(DeviceDisconnectedBeforeSendingApdu);

    await transport.destroy();
  });

  it("isolates onDisconnect callbacks and APDU routing per connected device", async () => {
    const webUsbDeviceA = createWebUsbLedgerDevice("ledger-A");
    const webUsbDeviceB = createWebUsbLedgerDevice("ledger-B");

    const machineSendApduCounts = new Map<DeviceId, number>();

    const transport = createTestTransport(
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
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceA, webUsbDeviceB] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

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
    const connectedA = unwrapConnectedDevice(connectA);

    const connectB = await transport.connect({
      deviceId: deviceIdB!,
      onDisconnect: id => onDisconnectB.push(id),
    });
    const connectedB = unwrapConnectedDevice(connectB);

    await transport.disconnect({ connectedDevice: connectedA });

    expect(onDisconnectA).toEqual([deviceIdA!]);
    expect(onDisconnectB).toEqual([]);

    const apduOnB = await connectedB.sendApdu(new Uint8Array([0xb0, 0x01]));
    expect(apduOnB.isRight()).toBe(true);
    expect(machineSendApduCounts.get(deviceIdB!)).toBe(1);
    expect(machineSendApduCounts.get(deviceIdA!) ?? 0).toBe(0);

    await transport.destroy();
  });

  it("does not return an empty list to a concurrent caller while a refresh is in-flight", async () => {
    // Regression: previously, updateTransportDiscoveredDevices() returned []
    // when a refresh was already running, which caused promptDeviceAccess() to
    // throw NoAccessibleDeviceError when a Windows polling tick (or attach
    // handler) overlapped with startDiscovering().
    const webUsbDevice = createWebUsbLedgerDevice();

    let releaseFirstScan: (() => void) | undefined;
    const firstScanGate = new Promise<void>(resolve => {
      releaseFirstScan = resolve;
    });
    let deviceListCalls = 0;

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => {
          deviceListCalls += 1;
          if (deviceListCalls === 1) {
            await firstScanGate;
          }
          return [webUsbDevice] as never[];
        },
        setInterval: () => 0 as unknown as ReturnType<typeof globalThis.setInterval>,
      }),
    );

    const first = transport.updateTransportDiscoveredDevices();
    const secondConcurrent = transport.updateTransportDiscoveredDevices();
    const thirdConcurrent = transport.updateTransportDiscoveredDevices();

    releaseFirstScan?.();

    const [firstResult, secondResult, thirdResult] = await Promise.all([
      first,
      secondConcurrent,
      thirdConcurrent,
    ]);

    expect(firstResult).toHaveLength(1);
    expect(secondResult).toHaveLength(1);
    expect(thirdResult).toHaveLength(1);
    // Concurrent callers coalesce onto a single fresh follow-up scan rather
    // than triggering one rescan per caller.
    expect(deviceListCalls).toBe(2);

    await transport.updateTransportDiscoveredDevices();
    expect(deviceListCalls).toBe(3);

    await transport.destroy();
  });

  it("does not emit duplicate discovered-device lists when the rescan is unchanged", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    await waitFor(() => {
      expect(emissions.at(-1)).toHaveLength(1);
    });
    const emissionsAfterFirstDiscovery = emissions.length;

    await transport.updateTransportDiscoveredDevices();

    expect(emissions).toHaveLength(emissionsAfterFirstDiscovery);

    await transport.destroy();
  });

  it("preserves the discovered device id when the same WebUSB identity appears as a new instance", async () => {
    const firstWebUsbDevice = createWebUsbLedgerDevice("same-identity");
    const secondWebUsbDevice = createWebUsbLedgerDevice("same-identity");
    let currentWebUsbDevice = firstWebUsbDevice;

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [currentWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    const originalDeviceId = await waitForFirstDeviceId(emissions);

    currentWebUsbDevice = secondWebUsbDevice;
    const rediscovered = await firstValueFrom(transport.startDiscovering());

    expect(rediscovered.id).toBe(originalDeviceId);

    await transport.destroy();
  });

  it("emits two discovered devices when same product devices have different serial numbers", async () => {
    const webUsbDeviceA = createWebUsbLedgerDevice("ledger-A");
    const webUsbDeviceB = createWebUsbLedgerDevice("ledger-B");

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceA, webUsbDeviceB] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    await waitFor(() => {
      const discovered = emissions.at(-1) ?? [];
      expect(discovered).toHaveLength(2);
      expect(new Set(discovered.map(device => device.id)).size).toBe(2);
    });

    await transport.destroy();
  });

  it("deduplicates serial-less discovered devices by vendor and product", async () => {
    const webUsbDeviceA = createWebUsbLedgerDevice("");
    const webUsbDeviceB = createWebUsbLedgerDevice("");

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceA, webUsbDeviceB] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    await waitFor(() => {
      expect(emissions.at(-1)).toHaveLength(1);
    });

    await transport.destroy();
  });

  it("reuses an active connection machine id when a rescan sees the same WebUSB identity", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("active-identity");
    const rescannedWebUsbDevice = createWebUsbLedgerDevice("active-identity");
    let currentWebUsbDevice = originalWebUsbDevice;
    let machineDeviceId: DeviceId | undefined;

    const transport = createTestTransport(
      params => {
        machineDeviceId = params.deviceId;

        return {
          setupConnection: async () => {},
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: originalWebUsbDevice as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [currentWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    const connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });

    currentWebUsbDevice = rescannedWebUsbDevice;
    const scanned = await transport.updateTransportDiscoveredDevices();

    expect(scanned[0]?.device).toBe(rescannedWebUsbDevice as never);
    expect(emissions.at(-1)?.[0]?.id).toBe(machineDeviceId);

    await transport.destroy();
  });

  it("deduplicates WebUSB devices with the same identity during discovery", async () => {
    const webUsbDeviceA = createWebUsbLedgerDevice("same-serial");
    const webUsbDeviceB = createWebUsbLedgerDevice("same-serial");

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceA, webUsbDeviceB] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    await waitFor(() => {
      expect(emissions.at(-1)).toHaveLength(1);
    });

    await transport.destroy();
  });

  it("restarts hotplug listeners after disconnect even when the explicit-close refresh fails", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let attachHandler: UsbConnectionListener | undefined;
    let detachHandler: UsbConnectionListener | undefined;
    let attachRegistrations = 0;
    let detachRegistrations = 0;
    let removeRegistrations = 0;
    let shouldFailRefresh = false;

    const transport = createTestTransport(
      params =>
        ({
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
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        usb: {
          getDevices: async () => {
            if (shouldFailRefresh) {
              throw new Error("refresh failed");
            }
            return [webUsbDevice] as never[];
          },
          addEventListener: (event: string, handler: unknown) => {
            if (event === "connect") {
              attachRegistrations += 1;
              attachHandler = handler as UsbConnectionListener;
            } else if (event === "disconnect") {
              detachRegistrations += 1;
              detachHandler = handler as UsbConnectionListener;
            }
          },
          removeEventListener: () => {
            removeRegistrations += 1;
          },
        },
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    const connectedDeviceId = await waitForFirstDeviceId(emissions);
    const connectResult = await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(connectResult);

    shouldFailRefresh = true;
    const disconnectResult = await transport.disconnect({ connectedDevice });

    expect(disconnectResult.isRight()).toBe(true);
    expect(attachRegistrations).toBe(2);
    expect(detachRegistrations).toBe(2);
    expect(removeRegistrations).toBe(2);
    expect(attachHandler).toBeDefined();
    expect(detachHandler).toBeDefined();

    await transport.destroy();
  });

  it("removes active routing during disconnect even when APDU sender close throws", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let connectedDeviceId: DeviceId | undefined;
    let machineSendApduCalls = 0;

    const transport = createTestTransport(
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
          closeConnection: () => {},
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () =>
        ({
          ...createStubApduSender(),
          closeConnection: async () => {
            throw new Error("APDU sender close failed");
          },
        }) as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    connectedDeviceId = await waitForFirstDeviceId(emissions);

    const connectResult = await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });
    const connectedDevice = unwrapConnectedDevice(connectResult);

    await expect(transport.disconnect({ connectedDevice })).rejects.toThrow(
      "APDU sender close failed",
    );

    const callsBefore = machineSendApduCalls;
    const apduResult = await connectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));

    expect(machineSendApduCalls).toBe(callsBefore);
    let leftError: unknown;
    apduResult.ifLeft(error => {
      leftError = error;
    });
    expect(leftError).toBeInstanceOf(DeviceDisconnectedBeforeSendingApdu);

    await transport.destroy();
  });

  it("restores previous dependencies and keeps the machine pending when setupConnection fails during reconnection", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("ledger-original");
    const replacementWebUsbDevice = createWebUsbLedgerDevice("ledger-original");

    let connectedDeviceId: DeviceId | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };
    let machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies> | undefined;

    const transport = createTestTransport(
      params => {
        machine = {
          setupConnection: async () => {
            setupConnectionCalls += 1;
            if (setupConnectionCalls === 2) {
              throw new Error("LIBUSB_ERROR_NO_DEVICE");
            }
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            dependencies = next;
          },
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
        return machine;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [originalWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });

    await transport.handleDeviceReconnection(machine!, replacementWebUsbDevice as never, 1);

    expect(setupConnectionCalls).toBe(2);
    expect(eventDeviceConnectedCalls).toBe(0);
    expect(dependencies.device).toBe(originalWebUsbDevice as never);

    await transport.handleDeviceReconnection(machine!, replacementWebUsbDevice as never, 1);

    expect(setupConnectionCalls).toBe(3);
    expect(eventDeviceConnectedCalls).toBe(1);
    expect(dependencies.device).toBe(replacementWebUsbDevice as never);

    await transport.destroy();
  });

  it("does not publish a machine as active when setDependencies throws during reconnection", async () => {
    const originalWebUsbDevice = createWebUsbLedgerDevice("ledger-original");
    const replacementWebUsbDevice = createWebUsbLedgerDevice("ledger-original");

    let currentDeviceList: WebUsbLedgerDevice[] = [originalWebUsbDevice];
    let connectedDeviceId: DeviceId | undefined;
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let setupConnectionCalls = 0;
    let eventDeviceConnectedCalls = 0;
    let eventDeviceDisconnectedCalls = 0;
    const dependencies: NodeWebUsbApduSenderDependencies = {
      device: originalWebUsbDevice as never,
      interfaceNumber: 1,
    };
    let machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies> | undefined;

    const transport = createTestTransport(
      params => {
        tryToReconnect = params.tryToReconnect;
        machine = {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => dependencies,
          setDependencies: (next: NodeWebUsbApduSenderDependencies) => {
            if (next.device === (replacementWebUsbDevice as never)) {
              throw new Error("dependency swap failed");
            }
          },
          eventDeviceDisconnected: () => {
            eventDeviceDisconnectedCalls += 1;
          },
          eventDeviceConnected: () => {
            eventDeviceConnectedCalls += 1;
          },
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
        return machine;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => currentDeviceList as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });

    currentDeviceList = [];
    tryToReconnect?.(0);
    await flushTasks();

    await transport.handleDeviceReconnection(machine!, replacementWebUsbDevice as never, 1);

    expect(setupConnectionCalls).toBe(1);
    expect(eventDeviceConnectedCalls).toBe(0);

    await transport.handleDeviceDisconnection(originalWebUsbDevice as never);

    expect(eventDeviceDisconnectedCalls).toBe(0);

    await transport.destroy();
  });

  it("skips non-Ledger USB devices during discovery", async () => {
    const nonLedgerDevice = {
      ...createWebUsbLedgerDevice("non-ledger"),
      vendorId: 0x1234,
    };
    const webUsbDevice = createWebUsbLedgerDevice();

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [nonLedgerDevice, webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);

    await waitFor(() => {
      expect(emissions.at(-1)).toHaveLength(1);
    });
    const scanned = await transport.updateTransportDiscoveredDevices();
    expect(scanned.map(device => device.device)).toEqual([webUsbDevice as never]);

    await transport.destroy();
  });

  it("throws no-accessible-device when discovered Ledger devices lack a WebUSB vendor interface", async () => {
    const webUsbDeviceWithoutVendorInterface = {
      ...createWebUsbLedgerDevice(),
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 3 }],
            },
          ],
        },
      ],
    };

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceWithoutVendorInterface] as never[],
      }),
    );

    await expect(firstValueFrom(transport.startDiscovering())).rejects.toBeInstanceOf(
      NoAccessibleDeviceError,
    );

    await transport.destroy();
  });

  it("throws no-accessible-device when discovered Ledger devices have no USB configurations", async () => {
    const webUsbDeviceWithoutConfigurations = {
      ...createWebUsbLedgerDevice(),
      configurations: [],
    };

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDeviceWithoutConfigurations] as never[],
      }),
    );

    await expect(firstValueFrom(transport.startDiscovering())).rejects.toBeInstanceOf(
      NoAccessibleDeviceError,
    );

    await transport.destroy();
  });

  it("reports its identifier/support and exposes no-op stop discovery", async () => {
    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [],
      }),
    );

    expect(transport.getIdentifier()).toBe("NODE-WEBUSB");
    expect(transport.isSupported()).toBe(true);
    expect(() => transport.stopDiscovering()).not.toThrow();

    await transport.destroy();
  });

  it("emits a discovered device from startDiscovering when a Ledger device is accessible", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const discovered = await firstValueFrom(transport.startDiscovering());

    expect(discovered.transport).toBe("NODE-WEBUSB");
    expect(discovered.deviceModel.productName).toBe("Ledger Nano S Plus");

    await transport.destroy();
  });

  it("discovers app-mode devices by shifted product id", async () => {
    const webUsbDevice = {
      ...createWebUsbLedgerDevice(),
      productId: 0x5000,
    };

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const discovered = await firstValueFrom(transport.startDiscovering());

    expect(discovered.deviceModel.productName).toBe("Ledger Nano S Plus");
    expect(discovered.transport).toBe("NODE-WEBUSB");

    await transport.destroy();
  });

  it("discovers bootloader-mode devices by exact bootloader product id", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    const transport = new NodeWebUsbTransport(
      {
        getAllDeviceModels: () => [
          {
            id: "bootloaderOnly",
            productName: "Bootloader-only test model",
            usbProductId: 0x51,
            bootloaderUsbProductId: 0x5011,
          },
        ],
      } as unknown as DeviceModelDataSource,
      () => createLogger(),
      createUnusedApduSenderFactory(),
      createUnusedApduReceiverFactory(),
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const discovered = await firstValueFrom(transport.startDiscovering());

    expect(discovered.deviceModel.productName).toBe("Bootloader-only test model");
    expect(discovered.transport).toBe("NODE-WEBUSB");

    await transport.destroy();
  });

  it("filters unrecognized devices during discovery without dropping recognized devices", async () => {
    const recognizedWebUsbDevice = createWebUsbLedgerDevice("recognized");
    const unrecognizedWebUsbDevice = {
      ...createWebUsbLedgerDevice("unrecognized"),
      productId: 0x9911,
    };

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [recognizedWebUsbDevice, unrecognizedWebUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    const scanned = await transport.updateTransportDiscoveredDevices();

    expect(scanned).toHaveLength(2);
    await waitFor(() => {
      expect(emissions.at(-1)).toHaveLength(1);
    });
    expect(emissions.at(-1)?.[0]?.transport).toBe("NODE-WEBUSB");

    await transport.destroy();
  });

  it("returns an empty scan and keeps the current discovery list when USB scanning fails", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();
    const records = { errors: [] as unknown[], warnings: [] as unknown[] };
    let shouldThrow = false;

    const transport = new NodeWebUsbTransport(
      createLedgerModelDataSource(),
      () => createRecordingLogger(records),
      createUnusedApduSenderFactory(),
      createUnusedApduReceiverFactory(),
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => {
          if (shouldThrow) {
            throw new Error("USB scan failed");
          }
          return [webUsbDevice] as never[];
        },
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    await waitFor(() => {
      expect(emissions.at(-1)).toHaveLength(1);
    });

    shouldThrow = true;
    const scanned = await transport.updateTransportDiscoveredDevices();

    expect(scanned).toEqual([]);
    expect(emissions.at(-1)).toHaveLength(1);
    expect(records.errors).toHaveLength(1);

    await transport.destroy();
  });

  it("reuses the active state machine for a second sequential connect to the same device", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let machineFactoryCalls = 0;
    let setupConnectionCalls = 0;
    let machineSendApduCalls = 0;

    const transport = createTestTransport(
      params => {
        machineFactoryCalls += 1;
        return {
          setupConnection: async () => {
            setupConnectionCalls += 1;
          },
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
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    const connectedDeviceId = await waitForFirstDeviceId(emissions);

    await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });
    const secondConnect = await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });
    const secondConnectedDevice = unwrapConnectedDevice(secondConnect);
    await secondConnectedDevice.sendApdu(new Uint8Array([0xb0, 0x01]));

    expect(machineFactoryCalls).toBe(1);
    expect(setupConnectionCalls).toBe(1);
    expect(machineSendApduCalls).toBe(1);

    await transport.destroy();
  });

  it("returns the shared setup error to concurrent connects when initial setup fails", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let releaseSetup: (() => void) | undefined;
    const setupGate = new Promise<void>(resolve => {
      releaseSetup = resolve;
    });
    let machineFactoryCalls = 0;

    const transport = createTestTransport(
      params => {
        machineFactoryCalls += 1;
        return {
          setupConnection: async () => {
            await setupGate;
            throw new Error("LIBUSB_ERROR_BUSY");
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
          closeConnection: () => {},
        } as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
      },
      () => createStubApduSender() as never,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [webUsbDevice] as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    const connectedDeviceId = await waitForFirstDeviceId(emissions);

    const firstConnect = transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });
    const secondConnect = transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: () => {},
    });

    releaseSetup?.();
    const results = await Promise.all([firstConnect, secondConnect]);

    expect(machineFactoryCalls).toBe(1);
    for (const result of results) {
      let leftError: unknown;
      result.ifLeft(error => {
        leftError = error;
      });
      expect(leftError).toBeInstanceOf(OpeningConnectionError);
    }

    await transport.destroy();
  });

  it("returns UnknownDeviceError when connecting to an undiscovered device id", async () => {
    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [],
      }),
    );

    const result = await transport.connect({
      deviceId: "missing-device",
      onDisconnect: () => {},
    });

    let leftError: unknown;
    result.ifLeft(error => {
      leftError = error;
    });
    expect(leftError).toBeInstanceOf(UnknownDeviceError);

    await transport.destroy();
  });

  it("returns UnknownDeviceError when disconnecting a device without an active connection", async () => {
    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => [],
      }),
    );

    const result = await transport.disconnect({
      connectedDevice: { id: "missing-device" } as TransportConnectedDevice,
    });

    let leftError: unknown;
    result.ifLeft(error => {
      leftError = error;
    });
    expect(leftError).toBeInstanceOf(UnknownDeviceError);

    await transport.destroy();
  });

  it("terminates a pending reconnection machine and notifies only that device", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();
    let currentDeviceList: WebUsbLedgerDevice[] = [webUsbDevice];
    let tryToReconnect:
      | DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>["tryToReconnect"]
      | undefined;
    let onTerminated: (() => void) | undefined;

    const transport = createTestTransport(
      params => {
        tryToReconnect = params.tryToReconnect;
        onTerminated = params.onTerminated;
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
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => currentDeviceList as never[],
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    const connectedDeviceId = await waitForFirstDeviceId(emissions);
    const onDisconnectCalls: DeviceId[] = [];

    await transport.connect({
      deviceId: connectedDeviceId,
      onDisconnect: id => onDisconnectCalls.push(id),
    });

    currentDeviceList = [];
    tryToReconnect?.(0);
    await flushTasks();
    onTerminated?.();

    expect(onDisconnectCalls).toEqual([connectedDeviceId]);

    await transport.destroy();
  });

  it("wires hotplug listeners to attach and detach handlers and removes them on destroy", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();

    let attachHandler: UsbConnectionListener | undefined;
    let detachHandler: UsbConnectionListener | undefined;
    const removedListeners: Array<{ event: string; handler: unknown }> = [];
    let getDevicesCalls = 0;

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        usb: {
          getDevices: async () => {
            getDevicesCalls += 1;
            return [];
          },
          addEventListener: (event: string, handler: unknown) => {
            if (event === "connect") {
              attachHandler = handler as UsbConnectionListener;
            } else if (event === "disconnect") {
              detachHandler = handler as UsbConnectionListener;
            }
          },
          removeEventListener: (event: string, handler: unknown) => {
            removedListeners.push({ event, handler });
          },
        },
      }),
    );

    expect(attachHandler).toBeDefined();
    expect(detachHandler).toBeDefined();

    attachHandler?.({ device: webUsbDevice });
    await waitFor(() => {
      expect(getDevicesCalls).toBe(1);
    });
    detachHandler?.({ device: webUsbDevice });
    await flushTasks();

    await transport.destroy();

    expect(removedListeners).toEqual([
      { event: "connect", handler: attachHandler },
      { event: "disconnect", handler: detachHandler },
    ]);
  });

  it("skips hotplug listeners when there is no USB bus, as node-usb 3 would reject unhandled", async () => {
    const events: string[] = [];
    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        hasUsbBus: () => false,
        usb: {
          getDevices: async () => [],
          addEventListener: (event: string) => {
            events.push(event);
          },
          removeEventListener: () => {},
        },
      }),
    );

    (transport as unknown as HotplugListenerProbe).startListeningToConnectionEvents();

    expect(events).toEqual([]);
    await transport.destroy();
  });

  it("keeps hotplug listener registration idempotent when listening is requested twice", async () => {
    let attachRegistrations = 0;
    let detachRegistrations = 0;
    const removedListeners: Array<{ event: string; handler: unknown }> = [];

    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        usb: {
          getDevices: async () => [],
          addEventListener: (event: string) => {
            if (event === "connect") {
              attachRegistrations += 1;
            } else if (event === "disconnect") {
              detachRegistrations += 1;
            }
          },
          removeEventListener: (event: string, handler: unknown) => {
            removedListeners.push({ event, handler });
          },
        },
      }),
    );

    (transport as unknown as HotplugListenerProbe).startListeningToConnectionEvents();

    expect(attachRegistrations).toBe(1);
    expect(detachRegistrations).toBe(1);

    await transport.destroy();
    expect(removedListeners).toHaveLength(2);
  });

  it("ignores Ledger attach events without a vendor interface", async () => {
    const webUsbDeviceWithoutVendorInterface = {
      ...createWebUsbLedgerDevice(),
      configurations: [
        {
          interfaces: [
            {
              interfaceNumber: 1,
              alternates: [{ interfaceClass: 3 }],
            },
          ],
        },
      ],
    };

    let getDevicesCalls = 0;
    const transport = createTestTransport(
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => {
          getDevicesCalls += 1;
          return [webUsbDeviceWithoutVendorInterface] as never[];
        },
      }),
    );

    await transport.handleDeviceConnection(webUsbDeviceWithoutVendorInterface as never);

    expect(getDevicesCalls).toBe(0);

    await transport.destroy();
  });

  it("swallows USB scan failures from Ledger attach events", async () => {
    const webUsbDevice = createWebUsbLedgerDevice();
    const records = { errors: [] as unknown[], warnings: [] as unknown[] };

    const transport = new NodeWebUsbTransport(
      createLedgerModelDataSource(),
      () => createRecordingLogger(records),
      createUnusedApduSenderFactory(),
      createUnusedApduReceiverFactory(),
      undefined,
      undefined,
      createPlatformBindings({
        platform: "linux",
        getDevices: async () => {
          throw new Error("getDevices failed");
        },
      }),
    );

    await transport.handleDeviceConnection(webUsbDevice as never);

    expect(records.errors).toHaveLength(1);

    await transport.destroy();
  });

  it("closes every active connection and clears hotplug resources on destroy", async () => {
    const webUsbDeviceA = createWebUsbLedgerDevice("ledger-A");
    const webUsbDeviceB = createWebUsbLedgerDevice("ledger-B");

    const machineCloseConnectionCalls: DeviceId[] = [];
    let apduSenderCloseConnectionCalls = 0;
    const removedListenerEvents: string[] = [];

    const transport = createTestTransport(
      params =>
        ({
          setupConnection: async () => {},
          sendApdu: async () => Right(new Uint8Array()) as never,
          getDeviceId: () => params.deviceId,
          getDependencies: () => ({
            device: webUsbDeviceA as never,
            interfaceNumber: 1,
          }),
          setDependencies: () => {},
          eventDeviceDisconnected: () => {},
          eventDeviceConnected: () => {},
          closeConnection: () => {
            machineCloseConnectionCalls.push(params.deviceId);
          },
        }) as unknown as DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
      () =>
        ({
          ...createStubApduSender(),
          closeConnection: async () => {
            apduSenderCloseConnectionCalls += 1;
          },
        }) as never,
      createPlatformBindings({
        platform: "linux",
        usb: {
          getDevices: async () => [webUsbDeviceA, webUsbDeviceB] as never[],
          addEventListener: () => {},
          removeEventListener: (event: string) => {
            removedListenerEvents.push(event);
          },
        },
      }),
    );

    const emissions = collectDeviceEmissions(transport);
    let deviceIdA: DeviceId | undefined;
    let deviceIdB: DeviceId | undefined;
    await waitFor(() => {
      const last = emissions.at(-1) ?? [];
      expect(last).toHaveLength(2);
      [deviceIdA, deviceIdB] = [last[0]!.id, last[1]!.id];
    });

    await transport.connect({
      deviceId: deviceIdA!,
      onDisconnect: () => {},
    });
    await transport.connect({
      deviceId: deviceIdB!,
      onDisconnect: () => {},
    });

    await transport.destroy();

    expect(machineCloseConnectionCalls.sort()).toEqual([deviceIdA!, deviceIdB!].sort());
    expect(apduSenderCloseConnectionCalls).toBe(2);
    expect(removedListenerEvents).toEqual(["connect", "disconnect"]);
  });

  it("creates a transport from the factory using the Node WebUSB identifier", async () => {
    const transport = nodeWebUsbTransportFactory({
      config: {},
      deviceModelDataSource: createLedgerModelDataSource(),
      loggerServiceFactory: () => createLogger(),
      apduSenderServiceFactory: createUnusedApduSenderFactory(),
      apduReceiverServiceFactory: createUnusedApduReceiverFactory(),
    } as unknown as TransportArgs);

    expect(transport.getIdentifier()).toBe("NODE-WEBUSB");
    await (transport as unknown as NodeWebUsbTransport).destroy();
  });
});
