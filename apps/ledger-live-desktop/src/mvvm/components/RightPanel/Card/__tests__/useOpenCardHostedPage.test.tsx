import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { act } from "@testing-library/react";
import { setEnv } from "@shared/env";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useOpenCardHostedPage } from "../useOpenCardHostedPage";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

const mockedManifest = jest.mocked(useLiveAppManifest);

const API_URL = "https://card.api.test";
const LOGIN_URL = `${API_URL}/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge`;
const SIGNUP_URL = "https://hosted.test/onboarding/signup";

const LOGIN_MANIFEST = {
  id: "baanx-login-url-stg",
  url: "https://dev.api.baanx.test/v1/auth/oauth2/authorize",
};
const HOSTED_MANIFEST = { id: "baanx-hosted-url-stg", url: "https://ledger.baanxapi.test" };

function manifestById(byId: Record<string, unknown>) {
  mockedManifest.mockImplementation(
    id =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (id ? byId[id] : undefined) as ReturnType<typeof useLiveAppManifest>,
  );
}

function renderOpenCardHostedPage(params?: Record<string, string>) {
  return renderHook(() => useOpenCardHostedPage(), {
    initialState: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true, ...params } },
    }),
  });
}

async function open(pageUrl: string, params?: Record<string, string>) {
  const { result } = renderOpenCardHostedPage(params);
  let error: unknown = null;
  await act(async () => {
    await result.current(pageUrl).catch((thrown: unknown) => {
      error = thrown;
    });
  });
  return error;
}

describe("useOpenCardHostedPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    setEnv("CARD_BAANX_API_URL", API_URL);
    manifestById({
      "baanx-login-url-stg": LOGIN_MANIFEST,
      "baanx-hosted-url-stg": HOSTED_MANIFEST,
    });
  });

  it("opens the authorize page on the login manifest origin, and keeps the query", async () => {
    await open(LOGIN_URL);

    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-login-url-stg?returnTo=%2Fpaytab", {
      state: {
        goToURL:
          "https://dev.api.baanx.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
      },
    });
  });

  it("opens any other path on the hosted manifest origin, and ignores the environment host", async () => {
    await open(SIGNUP_URL);

    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-hosted-url-stg?returnTo=%2Fpaytab", {
      state: { goToURL: "https://ledger.baanxapi.test/onboarding/signup" },
    });
  });

  it("takes the manifest ids the flag carries", async () => {
    manifestById({
      "another-login-manifest": { id: "another-login-manifest", url: "https://other.test" },
    });

    await open(LOGIN_URL, { baanx_login_manifest_id: "another-login-manifest" });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/platform/another-login-manifest?returnTo=%2Fpaytab",
      {
        state: {
          goToURL:
            "https://other.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
        },
      },
    );
  });

  it("opens nothing while the catalog holds no such manifest", async () => {
    manifestById({});

    const error = await open(LOGIN_URL);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(Error);
  });
});
