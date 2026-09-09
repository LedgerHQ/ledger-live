import { setEnv } from "@shared/env";
import { act } from "@testing-library/react";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useOpenCardHostedPage } from "../useOpenCardHostedPage";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const HOSTED_UI_URL = "https://hosted.test";
const LOGIN_URL = "https://card.api.test/v1/auth/oauth2/authorize?client_id=key";
const SIGNUP_URL = `${HOSTED_UI_URL}/onboarding/signup`;

function renderOpenCardHostedPage(params?: Record<string, string>) {
  return renderHook(() => useOpenCardHostedPage(), {
    initialState: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true, ...params } },
    }),
  });
}

describe("useOpenCardHostedPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    setEnv("CARD_BAANX_HOSTED_UI", HOSTED_UI_URL);
  });

  it("opens the authorize page in the login manifest, and waits for the deep link", async () => {
    const { result } = renderOpenCardHostedPage();

    let answer;
    await act(async () => {
      answer = await result.current(LOGIN_URL);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-login-url-stg", {
      state: { goToURL: LOGIN_URL, returnTo: "/paytab" },
    });
    expect(answer).toEqual({ type: "pending" });
  });

  it("opens the signup page in the hosted manifest, which whitelists that domain", async () => {
    const { result } = renderOpenCardHostedPage();

    await act(async () => {
      await result.current(SIGNUP_URL);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-hosted-url-stg", {
      state: { goToURL: SIGNUP_URL, returnTo: "/paytab" },
    });
  });

  it("takes the manifest ids the flag carries", async () => {
    const { result } = renderOpenCardHostedPage({
      baanx_login_manifest_id: "baanx-login-url",
      baanx_hosted_manifest_id: "baanx-hosted-url",
    });

    await act(async () => {
      await result.current(LOGIN_URL);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-login-url", expect.anything());
  });
});
