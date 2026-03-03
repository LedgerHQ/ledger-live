import type WebSocket from "ws";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import type { ProxyRuntimeContext } from "./createProxyContext";
import { startDeviceDiscovery } from "./startDeviceDiscovery";
import { broadcastToClients, mapDiscoveredDeviceToWsProxyDeviceInfo } from "./messaging";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));
jest.mock("./messaging", () => ({
  broadcastToClients: jest.fn(),
  mapDiscoveredDeviceToWsProxyDeviceInfo: jest.fn(
    (device: { id: string; deviceModel: { model: string; name: string } }) => ({
      id: device.id,
      deviceModel: {
        id: device.deviceModel.model,
        productName: device.deviceModel.name,
      },
    }),
  ),
}));

const { log } = jest.requireMock("@ledgerhq/logs") as { log: jest.Mock };

type DiscoveryObserver = {
  next: (devices: DiscoveredDevice[]) => void;
  error: (err: unknown) => void;
};

const makeDevice = (id: string, name = "Nano X"): DiscoveredDevice =>
  ({
    id,
    deviceModel: {
      model: "nanoX",
      name,
    },
  }) as unknown as DiscoveredDevice;

describe("startDeviceDiscovery", () => {
  let currentDiscoveredDevices: DiscoveredDevice[];
  let observer: DiscoveryObserver | null;
  let unsubscribe: jest.Mock;
  let runtimeContext: ProxyRuntimeContext;

  beforeEach(() => {
    currentDiscoveredDevices = [];
    observer = null;
    unsubscribe = jest.fn();

    runtimeContext = {
      resolvedPort: "8435",
      dmk: {
        listenToAvailableDevices: jest.fn(() => ({
          subscribe: (candidate: DiscoveryObserver) => {
            observer = candidate;
            return { unsubscribe };
          },
        })),
      } as unknown as ProxyRuntimeContext["dmk"],
      clients: new Set<WebSocket>(),
      getDiscoveredDevices: jest.fn(() => currentDiscoveredDevices),
      setDiscoveredDevices: jest.fn((devices: DiscoveredDevice[]) => {
        currentDiscoveredDevices = devices;
      }),
    };

    jest.clearAllMocks();
  });

  it("should subscribe to DMK discovery and expose teardown", () => {
    const stopDiscovery = startDeviceDiscovery(runtimeContext);

    expect(runtimeContext.dmk.listenToAvailableDevices).toHaveBeenCalledWith({});
    expect(typeof stopDiscovery).toBe("function");

    stopDiscovery();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should log added and removed devices then broadcast mapped discoveries", () => {
    currentDiscoveredDevices = [makeDevice("removed-123456", "Removed Device")];
    const nextDevices = [makeDevice("added-abcdef12", "Added Device")];
    const mappedDevice = {
      id: "added-abcdef12",
      deviceModel: {
        id: "nanoX",
        productName: "Added Device",
      },
    };
    jest.mocked(mapDiscoveredDeviceToWsProxyDeviceInfo).mockReturnValue(mappedDevice);

    startDeviceDiscovery(runtimeContext);
    observer?.next(nextDevices);

    expect(log).toHaveBeenCalledWith("proxy", "USB device connected: Added Device (added-ab...)");
    expect(log).toHaveBeenCalledWith(
      "proxy",
      "USB device disconnected: Removed Device (removed-...)",
    );
    expect(runtimeContext.setDiscoveredDevices).toHaveBeenCalledWith(nextDevices);
    expect(mapDiscoveredDeviceToWsProxyDeviceInfo).toHaveBeenNthCalledWith(
      1,
      nextDevices[0],
      0,
      nextDevices,
    );
    expect(broadcastToClients).toHaveBeenCalledWith(runtimeContext.clients, {
      type: "discovered-devices-updated",
      discoveredDevices: [mappedDevice],
    });
  });

  it("should log when no devices are detected and still broadcast", () => {
    startDeviceDiscovery(runtimeContext);
    observer?.next([]);

    expect(log).toHaveBeenCalledWith("proxy", "No USB devices detected");
    expect(runtimeContext.setDiscoveredDevices).toHaveBeenCalledWith([]);
    expect(broadcastToClients).toHaveBeenCalledWith(runtimeContext.clients, {
      type: "discovered-devices-updated",
      discoveredDevices: [],
    });
  });

  it("should log discovery errors", () => {
    startDeviceDiscovery(runtimeContext);
    observer?.error(new Error("boom"));

    expect(log).toHaveBeenCalledWith("proxy", "Discovery error: Error: boom");
  });
});
