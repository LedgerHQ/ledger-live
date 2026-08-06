import { act, renderHook, waitFor } from "@testing-library/react";
import { usePreAuthMutation } from "../../../state";
import { useCardLoginViewModel } from "../useCardLoginViewModel";

jest.mock("../../../state", () => ({
  usePreAuthMutation: jest.fn(),
}));

const mockedUsePreAuthMutation = jest.mocked(usePreAuthMutation);
const preAuth = jest.fn();
const unwrap = jest.fn();

describe("useCardLoginViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    preAuth.mockReturnValue({ unwrap });
    mockedUsePreAuthMutation.mockReturnValue([
      preAuth,
      { isLoading: false },
    ] as unknown as ReturnType<typeof usePreAuthMutation>);
  });

  it("should forward the hosted login URL for the default provider", async () => {
    const openHostedLogin = jest.fn().mockResolvedValue(undefined);
    unwrap.mockResolvedValue({ loginUrl: "https://card.example.com/login" });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(preAuth).toHaveBeenCalledWith({ provider: "baanx" });
      expect(openHostedLogin).toHaveBeenCalledWith("https://card.example.com/login");
    });
  });

  it("should expose an error when opening the hosted login fails", async () => {
    const openHostedLogin = jest.fn().mockRejectedValue(new Error("Browser unavailable"));
    unwrap.mockResolvedValue({ loginUrl: "https://card.example.com/login" });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Browser unavailable");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should not surface internal RTK error text", async () => {
    const openHostedLogin = jest.fn();
    unwrap.mockRejectedValue({
      status: "CUSTOM_ERROR",
      error: "payCardApiExtra not configured in store extraArgument",
    });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Unable to start login");
      expect(openHostedLogin).not.toHaveBeenCalled();
    });
  });

  it("should reject an insecure hosted login URL", async () => {
    const openHostedLogin = jest.fn();
    unwrap.mockResolvedValue({ loginUrl: "javascript:alert('login')" });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Unable to start login");
      expect(openHostedLogin).not.toHaveBeenCalled();
    });
  });

  it("should reflect the pre-auth loading state", () => {
    mockedUsePreAuthMutation.mockReturnValue([
      preAuth,
      { isLoading: true },
    ] as unknown as ReturnType<typeof usePreAuthMutation>);

    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin: jest.fn() }));

    expect(result.current.isLoading).toBe(true);
  });
});
