import { setEnv } from "@shared/env";
import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";
import { useOpenCardHostedPage } from "../useOpenCardHostedPage";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const HOSTED_UI_URL = "https://hosted.test";
const LOGIN_URL = "https://card.api.test/v1/auth/oauth2/authorize?client_id=key";
const SIGNUP_URL = `${HOSTED_UI_URL}/onboarding/signup`;

describe("useOpenCardHostedPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    setEnv("CARD_BAANX_HOSTED_UI", HOSTED_UI_URL);
    setEnv("CARD_LOGIN_MANIFEST_ID", "login-manifest");
    setEnv("CARD_HOSTED_MANIFEST_ID", "hosted-manifest");
  });

  it("opens the authorize page in the login manifest, and waits for the deep link", async () => {
    const { result } = renderHook(() => useOpenCardHostedPage());

    let answer;
    await act(async () => {
      answer = await result.current(LOGIN_URL);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/platform/login-manifest", {
      state: { goToURL: LOGIN_URL, returnTo: "/paytab" },
    });
    expect(answer).toEqual({ type: "pending" });
  });

  it("opens the signup page in the hosted manifest, which whitelists that domain", async () => {
    const { result } = renderHook(() => useOpenCardHostedPage());

    await act(async () => {
      await result.current(SIGNUP_URL);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/platform/hosted-manifest", {
      state: { goToURL: SIGNUP_URL, returnTo: "/paytab" },
    });
  });
});
