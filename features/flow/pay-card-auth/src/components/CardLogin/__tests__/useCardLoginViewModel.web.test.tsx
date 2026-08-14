import { act, renderHook, waitFor } from "@testing-library/react";
import { useInitiateAuthorizeMutation } from "@domain/api-card-management";
import { createAuthorizeAttempt } from "../../../state/authorizeAttempt";
import { useCardLoginViewModel } from "../useCardLoginViewModel";

jest.mock("@domain/api-card-management", () => ({
  useInitiateAuthorizeMutation: jest.fn(),
}));

jest.mock("../../../state/authorizeAttempt", () => ({
  createAuthorizeAttempt: jest.fn(),
}));

const mockedUseInitiateAuthorizeMutation = jest.mocked(useInitiateAuthorizeMutation);
const mockedCreateAuthorizeAttempt = jest.mocked(createAuthorizeAttempt);
const initiateAuthorize = jest.fn();
const unwrap = jest.fn();

const attempt = {
  state: "state-value",
  codeVerifier: "verifier-value",
  codeChallenge: "challenge-value",
};

const oauthConfig = { clientId: "client-id", redirectUri: "ledgerlive://paytab" };

function authorizeResponse(url: string) {
  return { token: "jwt", url };
}

describe("useCardLoginViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initiateAuthorize.mockReturnValue({ unwrap });
    mockedCreateAuthorizeAttempt.mockResolvedValue(attempt);
    mockedUseInitiateAuthorizeMutation.mockReturnValue([
      initiateAuthorize,
      { isLoading: false },
    ] as unknown as ReturnType<typeof useInitiateAuthorizeMutation>);
  });

  it("should forward the hosted login URL", async () => {
    const openHostedLogin = jest.fn().mockResolvedValue(undefined);
    // Query parameters must survive verbatim: the hosted UI reads the opaque request value and the
    // redirect back into the app from them.
    const url =
      "https://card.example.com/login?request=opaque%2Bvalue&redirect_uri=ledgerlive%3A%2F%2Fpaytab";
    unwrap.mockResolvedValue(authorizeResponse(url));
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin, oauthConfig }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(initiateAuthorize).toHaveBeenCalledWith({
        clientId: oauthConfig.clientId,
        redirectUri: oauthConfig.redirectUri,
        state: attempt.state,
        codeChallenge: attempt.codeChallenge,
      });
      expect(openHostedLogin).toHaveBeenCalledWith(url, oauthConfig.redirectUri);
    });
  });

  it("should show nothing once the browser closes", async () => {
    const openHostedLogin = jest.fn().mockResolvedValue(undefined);
    unwrap.mockResolvedValue(authorizeResponse("https://card.example.com/login"));
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin, oauthConfig }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.errorMessage).toBeNull();
    });
  });

  it("should not open the hosted login when the initiation fails", async () => {
    const openHostedLogin = jest.fn();
    unwrap.mockRejectedValue({ status: 422 });
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin, oauthConfig }));

    act(() => result.current.onLoginPress());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("Unable to start login");
      expect(openHostedLogin).not.toHaveBeenCalled();
    });
  });

  it("should expose an error when opening the hosted login fails", async () => {
    const openHostedLogin = jest.fn().mockRejectedValue(new Error("Browser unavailable"));
    unwrap.mockResolvedValue(authorizeResponse("https://card.example.com/login"));
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin, oauthConfig }));

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
    const { result } = renderHook(() => useCardLoginViewModel({ openHostedLogin, oauthConfig }));

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

    const { result } = renderHook(() =>
      useCardLoginViewModel({ openHostedLogin: jest.fn(), oauthConfig }),
    );

    expect(result.current.isLoading).toBe(true);
  });
});
