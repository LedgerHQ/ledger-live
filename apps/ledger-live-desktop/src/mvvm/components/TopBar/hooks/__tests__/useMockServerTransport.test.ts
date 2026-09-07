import { renderHook, act } from "tests/testSetup";
import { useMockServerTransport } from "../useMockServerTransport";
import { useMockServerStatus, type MockServerStatus } from "../useMockServerStatus";

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

  it("does nothing without a session token", () => {
    givenStatus({ sessionToken: undefined });
    const { result } = renderHook(() => useMockServerTransport());

    act(() => result.current.handleMockServer());

    expect(mockCopyToClipboard).not.toHaveBeenCalled();
  });

  it("is red while the mock server is unreachable", () => {
    givenStatus({ connected: false, sessionToken: "a-session-token" });
    const { result } = renderHook(() => useMockServerTransport());

    expect(result.current.className).toContain("bg-error-strong");
  });

  it("is hidden while the transport is disabled", () => {
    givenStatus({ enabled: false, sessionToken: undefined });
    const { result } = renderHook(() => useMockServerTransport());

    expect(result.current.isVisible).toBe(false);
  });
});
