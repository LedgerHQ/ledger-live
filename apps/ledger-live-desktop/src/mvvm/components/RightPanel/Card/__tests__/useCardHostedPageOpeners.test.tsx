import { ipcRenderer } from "electron";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { act } from "@testing-library/react";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useCardHostedPageOpeners } from "../useCardHostedPageOpeners";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

const mockedManifest = jest.mocked(useLiveAppManifest);
const mockedInvoke = jest.mocked(ipcRenderer.invoke);

const AUTHORIZE_URL =
  "https://card.api.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge";

const LOGIN_MANIFEST_URL = "https://dev.api.baanx.test/v1/auth/oauth2/authorize";

const CATALOG: Record<string, unknown> = {
  "baanx-login-url-stg": {
    id: "baanx-login-url-stg",
    url: LOGIN_MANIFEST_URL,
  },
  "baanx-hosted-url-stg": { id: "baanx-hosted-url-stg", url: "https://ledger.baanxapi.test" },
};

function manifestsFrom(catalog: Record<string, unknown>) {
  mockedManifest.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id => (id ? catalog[id] : undefined) as ReturnType<typeof useLiveAppManifest>,
  );
}

function renderOpeners(params?: Record<string, string>) {
  return renderHook(() => useCardHostedPageOpeners(), {
    initialState: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true, ...params } },
    }),
  });
}

async function run(action: () => Promise<unknown>) {
  let error: unknown = null;
  await act(async () => {
    await action().catch((thrown: unknown) => {
      error = thrown;
    });
  });
  return error;
}

describe("useCardHostedPageOpeners", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockedInvoke.mockClear();
    manifestsFrom(CATALOG);
  });

  describe("openHostedLogin", () => {
    it("opens the authorize page on the login manifest, and keeps the query", async () => {
      const { result } = renderOpeners();

      const answer = await act(async () => result.current.openHostedLogin(AUTHORIZE_URL));

      expect(mockNavigate).toHaveBeenCalledWith(
        "/platform/baanx-login-url-stg?returnTo=%2Fpaytab",
        {
          state: {
            goToURL:
              "https://dev.api.baanx.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
          },
        },
      );
      expect(answer).toEqual({ type: "pending" });
    });

    it("takes the login manifest id the flag carries", async () => {
      manifestsFrom({ other: { id: "other", url: "https://other.test" } });
      const { result } = renderOpeners({ baanx_login_manifest_id: "other" });

      await run(() => result.current.openHostedLogin(AUTHORIZE_URL));

      expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [
        "https://other.test",
      ]);
      expect(mockNavigate).toHaveBeenCalledWith("/platform/other?returnTo=%2Fpaytab", {
        state: {
          goToURL:
            "https://other.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
        },
      });
    });

    it("ends the provider session on the login manifest before it navigates", async () => {
      // A cold start reaches the login without a sign-in change, so this is the only wipe the
      // provider gets before it may sign the previous holder straight back in.
      let settleWipe!: (value: unknown) => void;
      mockedInvoke.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            settleWipe = resolve;
          }),
      );
      const { result } = renderOpeners();

      const opening = result.current.openHostedLogin(AUTHORIZE_URL);

      expect(mockedInvoke).toHaveBeenCalledWith("clearCardHostedSessionData", [LOGIN_MANIFEST_URL]);
      expect(mockNavigate).not.toHaveBeenCalled();

      settleWipe(undefined);
      await act(async () => {
        await opening;
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("opens the login anyway when the wipe fails", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("the session is not reachable"));
      const { result } = renderOpeners();

      const error = await run(() => result.current.openHostedLogin(AUTHORIZE_URL));

      expect(error).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith(
        "/platform/baanx-login-url-stg?returnTo=%2Fpaytab",
        {
          state: {
            goToURL:
              "https://dev.api.baanx.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
          },
        },
      );
    });
  });

  describe("openHostedPage", () => {
    it.each(["/onboarding/signup", "/kyc?step=2"])(
      "opens %s on the hosted manifest, with no environment host involved",
      async path => {
        const { result } = renderOpeners();

        await run(() => result.current.openHostedPage(path));

        expect(mockNavigate).toHaveBeenCalledWith(
          "/platform/baanx-hosted-url-stg?returnTo=%2Fpaytab",
          { state: { goToURL: `https://ledger.baanxapi.test${path}` } },
        );
        // The hosted page runs on the session the signed-in user already holds.
        expect(mockedInvoke).not.toHaveBeenCalled();
      },
    );

    it("takes the hosted manifest id the flag carries", async () => {
      manifestsFrom({ other: { id: "other", url: "https://other.test" } });
      const { result } = renderOpeners({ baanx_hosted_manifest_id: "other" });

      await run(() => result.current.openHostedPage("/onboarding/signup"));

      expect(mockNavigate).toHaveBeenCalledWith("/platform/other?returnTo=%2Fpaytab", {
        state: { goToURL: "https://other.test/onboarding/signup" },
      });
    });
  });

  it.each([
    [
      "openHostedLogin",
      (o: ReturnType<typeof useCardHostedPageOpeners>) => o.openHostedLogin(AUTHORIZE_URL),
    ],
    [
      "openHostedPage",
      (o: ReturnType<typeof useCardHostedPageOpeners>) => o.openHostedPage("/onboarding/signup"),
    ],
  ] as const)(
    "opens nothing from %s while the catalog holds no manifest",
    async (_name, action) => {
      manifestsFrom({});
      const { result } = renderOpeners();

      const error = await run(() => action(result.current));

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(error).toBeInstanceOf(Error);
    },
  );
});
