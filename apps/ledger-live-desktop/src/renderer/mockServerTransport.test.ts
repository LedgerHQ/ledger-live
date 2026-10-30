import { getEnv, getEnvDefault, setEnv, setEnvUnsafe } from "@shared/env";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { HttpResponse, http, server } from "tests/server";
import {
  bootstrapMockServerTransport,
  mockServerKnownDevice,
  MOCK_SERVER_TRANSPORT_STORAGE_KEY,
} from "./mockServerTransport";

const mockSetMockServerSessionToken = jest.fn();
let storedSessionToken: string | undefined;

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  mockserverIdentifier: "MOCKSERVER",
  getMockServerTransportUrl: () => "https://mock.example",
  getMockServerSessionToken: () => storedSessionToken,
  setMockServerSessionToken: (token: string) => mockSetMockServerSessionToken(token),
}));

const mockSetEnvOnAllThreads = jest.fn();

// Mirrors the real helper, minus the IPC send: the bootstrap relies on it to
// push the persisted toggle into the env it then reads back.
jest.mock("~/helpers/env", () => ({
  setEnvOnAllThreads: (name: string, value: unknown) => mockSetEnvOnAllThreads(name, value),
}));

const MOCK_SERVER_URL = "https://mock.example";

const endpoints = {
  auth: jest.fn<Response, [{ request: Request }]>(),
  seed: jest.fn<Response, [{ request: Request }]>(),
  import: jest.fn<Response, [{ request: Request }]>(),
};

const requestOf = (endpoint: jest.Mock) => endpoint.mock.calls[0][0].request as Request;

describe("mockServerKnownDevice", () => {
  it("maps the mock server Nano Gen5 type apexp to the apex model", () => {
    expect(mockServerKnownDevice("apexp")).toEqual({
      transport: mockserverIdentifier,
      deviceModelId: DeviceModelId.apex,
      id: "",
      name: null,
    });
  });
});

describe("bootstrapMockServerTransport", () => {
  const defaultSession = getEnv("MOCK_SERVER_SESSION");

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetEnvOnAllThreads.mockImplementation(setEnvUnsafe);
    storedSessionToken = undefined;
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "1");
    setEnv("MOCK_SERVER_SEED", "");
    setEnv("MOCK_SERVER_SESSION", defaultSession);
    endpoints.auth
      .mockReset()
      .mockImplementation(() => HttpResponse.json({ token: "a-token", expires_at: 0 }));
    endpoints.seed.mockReset().mockImplementation(() => HttpResponse.json({}));
    endpoints.import.mockReset().mockImplementation(() => HttpResponse.json({ devices: [] }));
    server.use(
      http.post(`${MOCK_SERVER_URL}/auth`, endpoints.auth),
      http.put(`${MOCK_SERVER_URL}/sessions/current/seed`, endpoints.seed),
      http.post(`${MOCK_SERVER_URL}/import`, endpoints.import),
    );
  });

  afterEach(() => {
    window.localStorage.clear();
    setEnv("BASE_SOCKET_URL", getEnvDefault("BASE_SOCKET_URL"));
    setEnv("MOCK_SERVER_TRANSPORT", false);
    setEnv("MOCK_SERVER_SEED", "");
    setEnv("MOCK_SERVER_SESSION", defaultSession);
  });

  it("does nothing while the transport is disabled", async () => {
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "0");

    await bootstrapMockServerTransport();

    expect(endpoints.auth).not.toHaveBeenCalled();
  });

  it("provisions a session when the transport is enabled at launch only", async () => {
    window.localStorage.removeItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY);
    setEnv("MOCK_SERVER_TRANSPORT", true);

    await bootstrapMockServerTransport();

    expect(endpoints.auth).toHaveBeenCalledTimes(1);
    expect(mockSetEnvOnAllThreads).toHaveBeenCalledWith("MOCK_SERVER_TRANSPORT", true);
  });

  it("lets a launch env override the persisted toggle", async () => {
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "0");
    setEnv("MOCK_SERVER_TRANSPORT", true);

    await bootstrapMockServerTransport();

    expect(endpoints.auth).toHaveBeenCalledTimes(1);
  });

  it("imports the default session and publishes the token", async () => {
    await bootstrapMockServerTransport();

    expect(endpoints.import).toHaveBeenCalledTimes(1);
    const importRequest = requestOf(endpoints.import);
    expect(importRequest.headers.get("Authorization")).toBe("Bearer a-token");
    expect(await importRequest.json()).toEqual(defaultSession);
    expect(mockSetMockServerSessionToken).toHaveBeenCalledWith("a-token");
  });

  it("routes the secure channel at the mock server session", async () => {
    await bootstrapMockServerTransport();

    expect(mockSetEnvOnAllThreads).toHaveBeenCalledWith(
      "BASE_SOCKET_URL",
      "wss://mock.example/secure-channel/a-token",
    );
  });

  it("skips the seed request when no seed is configured", async () => {
    await bootstrapMockServerTransport();

    expect(endpoints.seed).not.toHaveBeenCalled();
  });

  it("pushes a configured seed before importing the session", async () => {
    setEnv("MOCK_SERVER_SEED", " a test mnemonic ");

    await bootstrapMockServerTransport();

    const seedRequest = requestOf(endpoints.seed);
    expect(seedRequest.headers.get("Authorization")).toBe("Bearer a-token");
    expect(await seedRequest.json()).toEqual({ seed: "a test mnemonic" });
    expect(endpoints.seed.mock.invocationCallOrder[0]).toBeLessThan(
      endpoints.import.mock.invocationCallOrder[0],
    );
  });

  it("forwards a session override verbatim", async () => {
    const override = {
      devices: [{ name: "Ledger Flex", device_type: "flex" }],
    };
    setEnv("MOCK_SERVER_SESSION", override);

    await bootstrapMockServerTransport();

    expect(await requestOf(endpoints.import).json()).toEqual(override);
  });

  it("resets a mock BASE_SOCKET_URL once the transport is disabled", async () => {
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "0");
    setEnv("BASE_SOCKET_URL", "wss://mock.example/secure-channel/a-token");

    await bootstrapMockServerTransport();

    expect(getEnv("BASE_SOCKET_URL")).toBe(getEnvDefault("BASE_SOCKET_URL"));
  });

  it("keeps a BASE_SOCKET_URL that does not point at a mock secure channel", async () => {
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, "0");
    setEnv("BASE_SOCKET_URL", "wss://scriptrunner.example/update");

    await bootstrapMockServerTransport();

    expect(getEnv("BASE_SOCKET_URL")).toBe("wss://scriptrunner.example/update");
  });

  it("leaves the token unpublished when provisioning fails", async () => {
    endpoints.auth.mockImplementation(() => HttpResponse.error());
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(bootstrapMockServerTransport()).resolves.toBeNull();

    expect(mockSetMockServerSessionToken).not.toHaveBeenCalled();
  });
});
