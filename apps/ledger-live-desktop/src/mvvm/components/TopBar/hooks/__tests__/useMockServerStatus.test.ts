import { setEnv } from "@shared/env";
import { renderHook, waitFor } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import { useMockServerStatus } from "../useMockServerStatus";

let storedSessionToken: string | undefined;

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  getMockServerTransportUrl: () => "https://mock.example",
  getMockServerSessionToken: () => storedSessionToken,
}));

const endpoints = { health: jest.fn<Response, [{ request: Request }]>() };

describe("useMockServerStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storedSessionToken = undefined;
    setEnv("MOCK_SERVER_TRANSPORT", true);
    endpoints.health.mockReset().mockImplementation(() => HttpResponse.json({ status: "ok" }));
    server.use(http.get("https://mock.example/health", endpoints.health));
  });

  afterEach(() => {
    setEnv("MOCK_SERVER_TRANSPORT", false);
  });

  it("reports disconnected without polling while the transport is disabled", () => {
    setEnv("MOCK_SERVER_TRANSPORT", false);

    const { result } = renderHook(() => useMockServerStatus());

    expect(result.current).toEqual({ enabled: false, connected: false, sessionToken: undefined });
    expect(endpoints.health).not.toHaveBeenCalled();
  });

  it("polls /health and reports connected", async () => {
    const { result } = renderHook(() => useMockServerStatus());

    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(endpoints.health).toHaveBeenCalled();
  });

  it("reports disconnected while the mock server is unreachable", async () => {
    endpoints.health.mockImplementation(() => HttpResponse.error());

    const { result } = renderHook(() => useMockServerStatus());

    await waitFor(() => expect(endpoints.health).toHaveBeenCalled());
    expect(result.current.connected).toBe(false);
  });
});
