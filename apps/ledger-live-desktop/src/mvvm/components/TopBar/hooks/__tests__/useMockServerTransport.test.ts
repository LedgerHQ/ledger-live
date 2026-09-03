import { renderHook, act } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { useMockServerTransport } from "../useMockServerTransport";
import { useMockServerStatus, type MockServerStatus } from "../useMockServerStatus";

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  getMockServerTransportUrl: () => "https://mock.example",
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("../useMockServerStatus", () => ({
  useMockServerStatus: jest.fn(),
}));

const mockCopyToClipboard = jest.fn();
jest.mock("LLD/hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: () => mockCopyToClipboard,
}));

const givenStatus = (status: Partial<MockServerStatus>) =>
  jest.mocked(useMockServerStatus).mockReturnValue({ enabled: true, connected: true, ...status });

describe("useMockServerTransport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    givenStatus({ sessionToken: "a-session-token" });
  });

  it("copies the session token when clicked", () => {
    const { result } = renderHook(() => useMockServerTransport());

    act(() => result.current.handleMockServer());

    expect(mockCopyToClipboard).toHaveBeenCalledWith("a-session-token");
  });

  it("opens the configuration UI on the current session", () => {
    const { result } = renderHook(() => useMockServerTransport());

    act(() => result.current.handleOpenConfigurationUi());

    expect(openURL).toHaveBeenCalledWith("https://mock.example/#token=a-session-token", "");
  });

  it("escapes a session token that is not URL safe", () => {
    givenStatus({ sessionToken: "a+b/c=" });
    const { result } = renderHook(() => useMockServerTransport());

    act(() => result.current.handleOpenConfigurationUi());

    expect(openURL).toHaveBeenCalledWith("https://mock.example/#token=a%2Bb%2Fc%3D", "");
  });

  it("does nothing without a session token", () => {
    givenStatus({ sessionToken: undefined });
    const { result } = renderHook(() => useMockServerTransport());

    act(() => {
      result.current.handleMockServer();
      result.current.handleOpenConfigurationUi();
    });

    expect(mockCopyToClipboard).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("is hidden while the transport is disabled", () => {
    givenStatus({ enabled: false, sessionToken: undefined });
    const { result } = renderHook(() => useMockServerTransport());

    expect(result.current.isVisible).toBe(false);
  });
});
