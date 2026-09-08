import { setEnv } from "@shared/env";
import network from "@ledgerhq/live-network";
import { renderHook, waitFor } from "tests/testSetup";
import { useMockServerStatus } from "../useMockServerStatus";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

let storedSessionToken: string | undefined;

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  getMockServerTransportUrl: () => "https://mock.example",
  getMockServerSessionToken: () => storedSessionToken,
}));

const mockedNetwork = jest.mocked(network);

describe("useMockServerStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storedSessionToken = undefined;
    setEnv("MOCK_SERVER_TRANSPORT", true);
    mockedNetwork.mockResolvedValue({} as never);
  });

  afterEach(() => {
    setEnv("MOCK_SERVER_TRANSPORT", false);
  });

  it("reports disconnected without polling while the transport is disabled", () => {
    setEnv("MOCK_SERVER_TRANSPORT", false);

    const { result } = renderHook(() => useMockServerStatus());

    expect(result.current).toEqual({ enabled: false, connected: false, sessionToken: undefined });
    expect(mockedNetwork).not.toHaveBeenCalled();
  });

  it("polls /health and reports connected", async () => {
    const { result } = renderHook(() => useMockServerStatus());

    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://mock.example/health" }),
    );
  });

  it("reports disconnected while the mock server is unreachable", async () => {
    mockedNetwork.mockRejectedValue(new Error("unreachable"));

    const { result } = renderHook(() => useMockServerStatus());

    await waitFor(() => expect(mockedNetwork).toHaveBeenCalled());
    expect(result.current.connected).toBe(false);
  });
});
