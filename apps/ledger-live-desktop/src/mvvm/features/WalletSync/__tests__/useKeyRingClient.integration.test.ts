import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { getEnv, setEnv } from "@shared/env";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { readOnlyConfigStorage } from "@shared/app-config";
import type { KeyRingState } from "@domain/entity-key-ring";
import { classifyKeyRingError, type KeyRingClient } from "@features/platform-key-ring";
import { keyRingAuthChallengeFixture } from "@features/platform-key-ring/testing";
import { renderHook, waitFor, withFlagOverrides } from "tests/testSetup";

jest.mock("../hooks/useInstanceName", () => ({
  useInstanceName: () => "Desktop instance",
}));

const PROD_URL = getEnv("TRUSTCHAIN_API_PROD");
const STAGING_URL = getEnv("TRUSTCHAIN_API_STAGING");
const originalMockEnv = getEnv("MOCK");
const reactModule = jest.requireActual<typeof import("react")>("react");
const reactReduxModule = jest.requireActual<typeof import("react-redux")>("react-redux");

const KEY_RING_STATE: KeyRingState = {
  memberCredentials: {
    pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
    privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03", // gitleaks:allow
  },
  trustchain: {
    rootId: "ROOTID",
    applicationPath: "m/0'/16'/0'",
    walletSyncEncryptionKey: "wallet-sync-encryption-key",
  },
};

// The fake key tree has this keypair as a member on the prod backends only.
const endpoints = {
  prodChallenge: jest.fn(() =>
    HttpResponse.json({
      tlv: keyRingAuthChallengeFixture.tlv,
      json: keyRingAuthChallengeFixture.json,
    }),
  ),
  prodAuthenticate: jest.fn(() =>
    HttpResponse.json({
      access_token: makeJwt({ exp: 4102444800 }),
      permissions: { ROOTID: { "m/0'/16'/0'": "owner" } },
    }),
  ),
  stagingChallenge: jest.fn(() =>
    HttpResponse.json({
      tlv: keyRingAuthChallengeFixture.tlv,
      json: keyRingAuthChallengeFixture.json,
    }),
  ),
  stagingAuthenticate: jest.fn(() =>
    HttpResponse.json({ message: "Not a member of trustchain" }, { status: 401 }),
  ),
};
const server = setupServer(
  http.get(`${PROD_URL}/v1/challenge`, endpoints.prodChallenge),
  http.post(`${PROD_URL}/v1/authenticate`, endpoints.prodAuthenticate),
  http.get(`${STAGING_URL}/v1/challenge`, endpoints.stagingChallenge),
  http.post(`${STAGING_URL}/v1/authenticate`, endpoints.stagingAuthenticate),
);

describe("useKeyRingClient", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock("react", () => reactModule);
    jest.doMock("react-redux", () => reactReduxModule);
    setEnv("MOCK", "");
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    server.resetHandlers();
    setEnv("MOCK", originalMockEnv);
  });

  afterAll(() => {
    server.close();
  });

  it("should authenticate when the app config selects the backends the keypair is a member of", async () => {
    const store = await createStoreOnKeyRing("prod");
    const { useKeyRingClient, authenticate } = await importFreshClient();

    const { result } = renderHook(() => useKeyRingClient(), { store });

    await expect(authenticate(result.current)).resolves.toBe(true);

    expect(endpoints.prodAuthenticate).toHaveBeenCalledTimes(1);
    expect(endpoints.stagingAuthenticate).not.toHaveBeenCalled();
  });

  it("should reject as a removed member when the app config selects other backends", async () => {
    const store = await createStoreOnKeyRing("staging");
    const { useKeyRingClient, authenticate } = await importFreshClient();

    const { result } = renderHook(() => useKeyRingClient(), { store });

    const error = await authenticate(result.current).catch((rejection: unknown) => rejection);

    expect(classifyKeyRingError(error)).toBe("member-removed");
    expect(error).toMatchObject({
      message: "Not a member of trustchain",
      cause: expect.objectContaining({ name: "TrustchainEjected" }),
    });
  });

  it("should use the prod backends of a prod build when the app config selects none", async () => {
    const { useKeyRingClient, authenticate } = await importFreshClient();

    const { result } = renderHook(() => useKeyRingClient());

    await expect(authenticate(result.current)).resolves.toBe(true);
  });

  it("should ignore the environment of the feature flag", async () => {
    const { useKeyRingClient, authenticate } = await importFreshClient();

    const { result } = renderHook(() => useKeyRingClient(), {
      initialState: withFlagOverrides({
        lldWalletSync: {
          enabled: true,
          params: { environment: "STAGING", watchConfig: {}, learnMoreLink: "" },
        },
      }),
    });

    await expect(authenticate(result.current)).resolves.toBe(true);
    expect(endpoints.stagingAuthenticate).not.toHaveBeenCalled();
  });

  it("should keep the backends of the app config when remote feature flags fail at startup", async () => {
    const createStore = (await import("~/state-manager/configureStore")).default;
    const { useKeyRingClient, authenticate } = await importFreshClient();

    jest.useFakeTimers();
    const fetchRemoteFlags = jest.fn().mockRejectedValue(new Error("network down"));
    const store = createStore({ fetchRemoteFlags });

    await waitFor(() => {
      expect(selectRemoteFlagsReady(store.getState())).toBe(true);
    });

    const { result } = renderHook(() => useKeyRingClient(), { store });

    jest.clearAllTimers();
    jest.useRealTimers();

    await expect(authenticate(result.current)).resolves.toBe(true);
  });
});

async function createStoreOnKeyRing(ledgerKeyRing: "prod" | "staging") {
  const createStore = (await import("~/state-manager/configureStore")).default;
  const { loadAppConfig } = await import("~/setup");
  return createStore({
    fetchRemoteFlags: null,
    appConfig: loadAppConfig({
      selections: readOnlyConfigStorage(() => ({ ledgerKeyRing })),
      devValues: readOnlyConfigStorage(() => ({})),
    }),
  });
}

async function importFreshClient() {
  const { useKeyRingClient } = await import("../hooks/useKeyRingClient");
  const { selectKeyRingSession } = await import("@features/platform-key-ring");
  const session = selectKeyRingSession({ trustchain: KEY_RING_STATE });
  function authenticate(client: KeyRingClient) {
    const stream = client.openStream(session);
    if (!stream) throw new Error("the key ring state has no stream");
    return stream.withAuth(async () => true, "no-cache");
  }
  return { useKeyRingClient, authenticate };
}

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}
