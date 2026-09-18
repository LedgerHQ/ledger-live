import { ipcRenderer } from "electron";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { act } from "@testing-library/react";
import { getEnvDefault, setEnv } from "@shared/env";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useCardHostedPageOpeners } from "../useCardHostedPageOpeners";
import { useWipeHostedSession } from "../useWipeHostedSession";

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
  "baanx-login-url": {
    id: "baanx-login-url",
    url: LOGIN_MANIFEST_URL,
  },
  "baanx-hosted-url": { id: "baanx-hosted-url", url: "https://ledger.baanxapi.test" },
};

function manifestsFrom(catalog: Record<string, unknown>) {
  mockedManifest.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id => (id ? catalog[id] : undefined) as ReturnType<typeof useLiveAppManifest>,
  );
}

function renderOpeners() {
  return renderHook(() => useCardHostedPageOpeners(), {
    initialState: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true } },
    }),
  });
}

function renderOpenersWithWipe() {
  return renderHook(
    () => {
      useWipeHostedSession();
      return useCardHostedPageOpeners();
    },
    {
      initialState: withFlagOverrides({
        lwdPayTab: { enabled: true, params: { card: true } },
      }),
    },
  );
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

  afterEach(() => {
    setEnv("CARD_BAANX_LOGIN_MANIFEST_ID", getEnvDefault("CARD_BAANX_LOGIN_MANIFEST_ID"));
    setEnv("CARD_BAANX_HOSTED_MANIFEST_ID", getEnvDefault("CARD_BAANX_HOSTED_MANIFEST_ID"));
  });

  describe("openHostedLogin", () => {
    it("opens the authorize page on the login manifest, and keeps the query", async () => {
      const { result } = renderOpeners();

      const answer = await act(async () => result.current.openHostedLogin(AUTHORIZE_URL));

      expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-login-url?returnTo=%2Fpaytab", {
        state: {
          goToURL:
            "https://dev.api.baanx.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
        },
      });
      expect(answer).toEqual({ type: "pending" });
    });

    it("takes the login manifest id the env carries", async () => {
      manifestsFrom({ other: { id: "other", url: "https://other.test" } });
      setEnv("CARD_BAANX_LOGIN_MANIFEST_ID", "other");
      const { result } = renderOpeners();

      await run(() => result.current.openHostedLogin(AUTHORIZE_URL));

      expect(mockNavigate).toHaveBeenCalledWith("/platform/other?returnTo=%2Fpaytab", {
        state: {
          goToURL:
            "https://other.test/v1/auth/oauth2/authorize?client_id=key&code_challenge=challenge",
        },
      });
    });

    it("asks for no wipe of its own, since the entry of the pay tab already ended the session", async () => {
      const { result } = renderOpeners();

      await run(() => result.current.openHostedLogin(AUTHORIZE_URL));

      expect(mockedInvoke).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe("openHostedPage", () => {
    it("opens /kyc?step=2 on the hosted manifest, with no environment host involved", async () => {
      const { result } = renderOpeners();

      await run(() => result.current.openHostedPage("/kyc?step=2"));

      expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-hosted-url?returnTo=%2Fpaytab", {
        state: { goToURL: "https://ledger.baanxapi.test/kyc?step=2" },
      });
      // The hosted page runs on the session the signed-in user already holds.
      expect(mockedInvoke).not.toHaveBeenCalled();
    });

    it("opens /onboarding/signup on the hosted manifest, with no environment host involved", async () => {
      const { result } = renderOpeners();

      await run(() => result.current.openHostedPage("/onboarding/signup"));

      expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-hosted-url?returnTo=%2Fpaytab", {
        state: { goToURL: "https://ledger.baanxapi.test/onboarding/signup" },
      });
    });

    it("asks for no wipe before the signup, since the entry of the pay tab ended the session", async () => {
      const { result } = renderOpeners();

      await run(() => result.current.openHostedPage("/onboarding/signup"));

      expect(mockedInvoke).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("takes the hosted manifest id the env carries", async () => {
      manifestsFrom({ other: { id: "other", url: "https://other.test" } });
      setEnv("CARD_BAANX_HOSTED_MANIFEST_ID", "other");
      const { result } = renderOpeners();

      await run(() => result.current.openHostedPage("/onboarding/signup"));

      expect(mockNavigate).toHaveBeenCalledWith("/platform/other?returnTo=%2Fpaytab", {
        state: { goToURL: "https://other.test/onboarding/signup" },
      });
    });
  });

  describe("the wipe of the pay tab entry", () => {
    it("holds the navigation back until the wipe of every manifest has settled", async () => {
      const settleWipes: ((value: unknown) => void)[] = [];
      mockedInvoke.mockImplementationOnce(() => new Promise(resolve => settleWipes.push(resolve)));
      mockedInvoke.mockImplementationOnce(() => new Promise(resolve => settleWipes.push(resolve)));
      const { result } = renderOpenersWithWipe();

      expect(settleWipes).toHaveLength(2);

      const opening = result.current.openHostedPage("/topup");

      expect(mockNavigate).not.toHaveBeenCalled();

      settleWipes[0](undefined);
      settleWipes[1](undefined);
      await act(async () => {
        await opening;
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
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
