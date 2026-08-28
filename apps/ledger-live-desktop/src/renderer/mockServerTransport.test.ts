import { getEnv, setEnv, setEnvUnsafe } from "@shared/env";
import network from "@ledgerhq/live-network";
import {
  bootstrapMockServerTransport,
  MOCK_SERVER_TRANSPORT_STORAGE_KEY,
} from "./mockServerTransport";

jest.mock("@ledgerhq/live-network", () => ({ __esModule: true, default: jest.fn() }));

const mockSetMockServerSessionToken = jest.fn();
let storedSessionToken: string | undefined;

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  getMockServerTransportUrl: () => "https://mock.example",
  getMockServerSessionToken: () => storedSessionToken,
  setMockServerSessionToken: (token: string) => mockSetMockServerSessionToken(token),
  getMockScriptRunnerBaseUrl: () => undefined,
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
    const override = { devices: [{ name: "Ledger Flex", device_type: "flex" }] };
    setEnv("MOCK_SERVER_SESSION", override);

    await bootstrapMockServerTransport();

    expect(requestsTo("/import")[0]).toEqual(expect.objectContaining({ data: override }));
  });

  it("leaves the token unpublished when provisioning fails", async () => {
    mockedNetwork.mockRejectedValue(new Error("unreachable"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    await bootstrapMockServerTransport();

    expect(mockSetMockServerSessionToken).not.toHaveBeenCalled();
  });
});
