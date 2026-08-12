import { act, renderHook, waitFor } from "@testing-library/react";
import { useInitiateAuthorizeMutation } from "@domain/api-card-management";
import { useCardLoginViewModel } from "../useCardLoginViewModel";

jest.mock("@domain/api-card-management", () => ({
  useInitiateAuthorizeMutation: jest.fn(),
}));

const mockedUseInitiateAuthorizeMutation = jest.mocked(useInitiateAuthorizeMutation);
const initiateAuthorize = jest.fn();
const unwrap = jest.fn();

describe("useCardLoginViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initiateAuthorize.mockReturnValue({ unwrap });
    mockedUseInitiateAuthorizeMutation.mockReturnValue([
      initiateAuthorize,
      { isLoading: false },
    ] as unknown as ReturnType<typeof useInitiateAuthorizeMutation>);
  });

  it("should forward the hosted login URL", async () => {
    const openHostedLogin = jest.fn().mockResolvedValue(undefined);
    unwrap.mockResolvedValue({ token: "jwt", url: "https://card.example.com/login" });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(initiateAuthorize).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: expect.any(String),
          redirectUri: expect.any(String),
          state: expect.any(String),
          codeChallenge: expect.any(String),
        }),
      );
      expect(openHostedLogin).toHaveBeenCalledWith("https://card.example.com/login");
    });
  });

  it("should expose an error when opening the hosted login fails", async () => {
    const openHostedLogin = jest.fn().mockRejectedValue(new Error("Browser unavailable"));
    unwrap.mockResolvedValue({ token: "jwt", url: "https://card.example.com/login" });
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
      status: 401,
      data: { message: "unauthorized" },
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
    unwrap.mockResolvedValue({ token: "jwt", url: "javascript:alert('login')" });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Unable to start login");
      expect(openHostedLogin).not.toHaveBeenCalled();
    });
  });

  it("should reflect the authorize initiation loading state", () => {
    mockedUseInitiateAuthorizeMutation.mockReturnValue([
      initiateAuthorize,
      { isLoading: true },
    ] as unknown as ReturnType<typeof useInitiateAuthorizeMutation>);

    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin: jest.fn() }));

    expect(result.current.isLoading).toBe(true);
  });
});
