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
const LOGIN_URL =
  "https://card.api.test/v1/auth/oauth2/authorize?client_id=key&response_type=code&code_challenge=challenge";
const SIGNUP_URL = `${HOSTED_UI_URL}/onboarding/signup`;
const LOGIN_ROUTE = "/platform/baanx-login-url-stg?returnTo=%2Fpaytab";

function renderOpenCardHostedPage(params?: Record<string, string>) {
  return renderHook(() => useOpenCardHostedPage(), {
    initialState: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true, ...params } },
    }),
  });
}

async function open(pageUrl: string, params?: Record<string, string>) {
  const { result } = renderOpenCardHostedPage(params);
  let answer;
  await act(async () => {
    answer = await result.current(pageUrl);
  });
  return answer;
}

describe("useOpenCardHostedPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    setEnv("CARD_BAANX_HOSTED_UI", HOSTED_UI_URL);
  });

  it("opens the login manifest, and hands the live app the authorize query", async () => {
    const answer = await open(LOGIN_URL);

    expect(mockNavigate).toHaveBeenCalledWith(LOGIN_ROUTE, {
      state: { client_id: "key", response_type: "code", code_challenge: "challenge" },
    });
    expect(answer).toEqual({ type: "pending" });
  });

  it("opens the signup page whole, because the hosted manifest carries no such path", async () => {
    await open(SIGNUP_URL);

    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-hosted-url-stg?returnTo=%2Fpaytab", {
      state: { goToURL: SIGNUP_URL },
    });
  });

  it("takes the manifest ids the flag carries", async () => {
    await open(LOGIN_URL, { baanx_login_manifest_id: "baanx-login-url" });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/platform/baanx-login-url?returnTo=%2Fpaytab",
      expect.anything(),
    );
  });
});
