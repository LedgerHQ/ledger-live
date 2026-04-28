import { afterEach, describe, expect, it } from "bun:test";
import type {
  ApduReceiverServiceFactory,
  ApduSenderServiceFactory,
  DeviceModelDataSource,
  LoggerPublisherService,
} from "@ledgerhq/device-management-kit";
import type { Subscription } from "rxjs";
import { NodeWebUsbTransport } from "./NodeWebUsbTransport";

function flushTasks(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
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
    await flushTasks();

    expect(emissions).toHaveLength(1);
    expect(emissions[0]?.transport).toBe("NODE-WEBUSB");
    expect(typeof emissions[0]?.id).toBe("string");

    transport.destroy();
    expect(clearedInterval).not.toBeNull();
  });
});
