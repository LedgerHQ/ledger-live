import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { getEnv, setEnv, setEnvUnsafe } from "@shared/env";
import network from "@ledgerhq/live-network";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import {
  bootstrapMockServerTransport,
  swapMockServerDevice,
  MOCK_SERVER_TRANSPORT_STORAGE_KEY,
} from "./mockServerTransport";
import {
  buildMockServerDeviceConfig,
  defaultMockServerDeviceSelection,
  MOCK_SERVER_DEVICE_STORAGE_KEY,
  readMockServerDevice,
} from "./mockServerDevice";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockSetMockServerSessionToken = jest.fn();
const mockTransportOpen = jest.fn();
let storedSessionToken: string | undefined;

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  getMockServerTransportUrl: () => "https://mock.example",
  getMockServerSessionToken: () => storedSessionToken,
  setMockServerSessionToken: (token: string) => mockSetMockServerSessionToken(token),
  getMockScriptRunnerBaseUrl: () => undefined,
  DeviceManagementKitTransport: {
    open: (options?: { deviceId?: string }) => mockTransportOpen(options),
  },
}));

const mockSetEnvOnAllThreads = jest.fn();

// Mirrors the real helper, minus the IPC send: the bootstrap relies on it to
// push the persisted toggle into the env it then reads back.
jest.mock("~/helpers/env", () => ({
  setEnvOnAllThreads: (name: string, value: unknown) => mockSetEnvOnAllThreads(name, value),
}));

const mockedNetwork = jest.mocked(network);

const requestsTo = (path: string) =>
  mockedNetwork.mock.calls.map(([config]) => config).filter(config => config.url?.endsWith(path));

describe("bootstrapMockServerTransport", () => {
  const defaultSession = getEnv("MOCK_SERVER_SESSION");

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetEnvOnAllThreads.mockImplementation(setEnvUnsafe);
    storedSessionToken = undefined;
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "1");
    setEnv("MOCK_SERVER_SEED", "");
    setEnv("MOCK_SERVER_SESSION", defaultSession);
    mockedNetwork.mockResolvedValue({ data: { token: "a-token" } } as never);
  });

  afterEach(() => {
    window.localStorage.clear();
    setEnv("MOCK_SERVER_TRANSPORT", false);
    setEnv("MOCK_SERVER_SEED", "");
    setEnv("MOCK_SERVER_SESSION", defaultSession);
  });

  it("does nothing while the transport is disabled", async () => {
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "0");

    await bootstrapMockServerTransport();

    expect(mockedNetwork).not.toHaveBeenCalled();
  });

  it("provisions a session when the transport is enabled at launch only", async () => {
    window.localStorage.removeItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY);
    setEnv("MOCK_SERVER_TRANSPORT", true);

    await bootstrapMockServerTransport();

    expect(requestsTo("/auth")).toHaveLength(1);
    expect(mockSetEnvOnAllThreads).toHaveBeenCalledWith("MOCK_SERVER_TRANSPORT", true);
  });

  it("lets a launch env override the persisted toggle", async () => {
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "0");
    setEnv("MOCK_SERVER_TRANSPORT", true);

    await bootstrapMockServerTransport();

    expect(requestsTo("/auth")).toHaveLength(1);
  });

  it("imports the default session and publishes the token", async () => {
    await bootstrapMockServerTransport();

    expect(requestsTo("/import")).toEqual([
      expect.objectContaining({
        method: "POST",
        url: "https://mock.example/import",
        data: defaultSession,
        headers: { Authorization: "Bearer a-token" },
      }),
    ]);
    expect(mockSetMockServerSessionToken).toHaveBeenCalledWith("a-token");
  });

  it("skips the seed request when no seed is configured", async () => {
    await bootstrapMockServerTransport();

    expect(requestsTo("/sessions/current/seed")).toHaveLength(0);
  });

  it("pushes a configured seed before importing the session", async () => {
    setEnv("MOCK_SERVER_SEED", " a test mnemonic ");

    await bootstrapMockServerTransport();

    expect(requestsTo("/sessions/current/seed")).toEqual([
      expect.objectContaining({
        method: "PUT",
        url: "https://mock.example/sessions/current/seed",
        data: { seed: "a test mnemonic" },
        headers: { Authorization: "Bearer a-token" },
      }),
    ]);

    const paths = mockedNetwork.mock.calls.map(([config]) => config.url);
    expect(paths.indexOf("https://mock.example/sessions/current/seed")).toBeLessThan(
      paths.indexOf("https://mock.example/import"),
    );
  });

  it("forwards a session override verbatim", async () => {
    const override = {
      devices: [{ name: "Ledger Flex", device_type: "flex" }],
    };
    setEnv("MOCK_SERVER_SESSION", override);

    await bootstrapMockServerTransport();

    expect(requestsTo("/import")[0]).toEqual(expect.objectContaining({ data: override }));
  });

  it("imports the device picked in the developer settings", async () => {
    const selection = { model: DeviceModelId.FLEX, onboarded: false, osVersion: "1.5.1" };
    window.localStorage.setItem(MOCK_SERVER_DEVICE_STORAGE_KEY, JSON.stringify(selection));

    await bootstrapMockServerTransport();

    expect(requestsTo("/import")[0]).toEqual(
      expect.objectContaining({
        data: { devices: [buildMockServerDeviceConfig(selection)] },
      }),
    );
  });

  it("leaves the token unpublished when provisioning fails", async () => {
    mockedNetwork.mockRejectedValue(new Error("unreachable"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    await bootstrapMockServerTransport();

    expect(mockSetMockServerSessionToken).not.toHaveBeenCalled();
  });
});

describe("swapMockServerDevice", () => {
  const selection = defaultMockServerDeviceSelection(DeviceModelId.FLEX);
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetEnvOnAllThreads.mockImplementation(setEnvUnsafe);
    storedSessionToken = "a-token";
    activeDeviceSessionSubject.next(null);
    mockedNetwork.mockImplementation((async ({
      method,
      url,
    }: {
      method?: string;
      url?: string;
    }) => {
      if (method === "GET" && url?.endsWith("/devices")) return { data: [{ id: "old" }] };
      if (method === "POST" && url?.endsWith("/devices")) return { data: { id: "new" } };
      return { data: {} };
    }) as never);
  });

  afterEach(() => {
    window.localStorage.clear();
    activeDeviceSessionSubject.next(null);
  });

  const callsInOrder = () =>
    mockedNetwork.mock.calls.map(([config]) => `${config.method} ${config.url}`);

  it("attaches and connects the new device before removing the old one", async () => {
    await swapMockServerDevice(selection);

    expect(callsInOrder()).toEqual([
      "GET https://mock.example/devices",
      "POST https://mock.example/devices",
      "DELETE https://mock.example/devices/old",
    ]);
    expect(mockTransportOpen).toHaveBeenCalledWith({ deviceId: "new" });

    // The reconnect has to land before the old device is deleted, otherwise
    // discovery can go empty and every device flow loses its device.
    const openOrder = mockTransportOpen.mock.invocationCallOrder[0];
    const deleteCall = mockedNetwork.mock.calls.findIndex(([config]) => config.method === "DELETE");
    expect(openOrder).toBeLessThan(mockedNetwork.mock.invocationCallOrder[deleteCall]);
  });

  it("attaches the picked device", async () => {
    await swapMockServerDevice(selection);

    const [attach] = mockedNetwork.mock.calls
      .map(([config]) => config)
      .filter(config => config.method === "POST");
    expect(attach.data).toEqual(buildMockServerDeviceConfig(selection));
  });

  it("persists the selection so a restart boots on it", async () => {
    await swapMockServerDevice(selection);

    expect(readMockServerDevice()).toEqual(selection);
  });

  it("drops Ledger Live's session on the old device first", async () => {
    activeDeviceSessionSubject.next({
      sessionId: "old-session",
      transport: { disconnect: mockDisconnect } as never,
    });

    await swapMockServerDevice(selection);

    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockTransportOpen.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockDisconnect.mock.invocationCallOrder[0],
    );
  });

  it("provisions a session instead of swapping when there is none", async () => {
    storedSessionToken = undefined;
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "1");
    mockedNetwork.mockResolvedValue({ data: { token: "a-token" } } as never);

    await swapMockServerDevice(selection);

    expect(callsInOrder()).toEqual([
      "POST https://mock.example/auth",
      "POST https://mock.example/import",
    ]);
    expect(mockTransportOpen).not.toHaveBeenCalled();
  });

  it("surfaces a mock server failure to the caller", async () => {
    mockedNetwork.mockRejectedValue(new Error("unreachable"));

    await expect(swapMockServerDevice(selection)).rejects.toThrow("unreachable");
  });
});
