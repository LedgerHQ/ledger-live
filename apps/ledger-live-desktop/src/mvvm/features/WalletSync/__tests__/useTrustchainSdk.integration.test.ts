import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { getEnv, setEnv } from "@shared/env";
import { getWalletSyncEnvironmentParams } from "@features/platform-wallet-sync";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { renderHook, withFlagOverrides } from "tests/testSetup";

jest.mock("../hooks/useInstanceName", () => ({
  useInstanceName: () => "Desktop instance",
}));

const PROD_URL = getWalletSyncEnvironmentParams("PROD").trustchainApiBaseUrl;
const STAGING_URL = getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl;
const originalMockEnv = getEnv("MOCK");
const originalWalletSyncEnvironment = process.env.WALLET_SYNC_ENVIRONMENT;
const reactModule = jest.requireActual<typeof import("react")>("react");
const reactReduxModule = jest.requireActual<typeof import("react-redux")>("react-redux");

const MEMBER_CREDENTIALS: MemberCredentials = {
  pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
  privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03", // gitleaks:allow
};

const trustchain: Trustchain = {
  rootId: "ROOTID",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "wallet-sync-encryption-key",
};

// In this test suite, the fake trustchain is always a member of the PROD environment
// and never a member of the STAGING environment.
// So the authentication should always succeed on PROD and fail on STAGING.
const endpoints = {
  prodChallenge: jest.fn(() => HttpResponse.json({ tlv: CHALLENGE.tlv, json: CHALLENGE.json })),
  prodAuthenticate: jest.fn(() =>
    HttpResponse.json({ access_token: makeJwt({ exp: 4102444800 }) }),
  ),
  stagingChallenge: jest.fn(() => HttpResponse.json({ tlv: CHALLENGE.tlv, json: CHALLENGE.json })),
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

describe("useTrustchainSdk", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock("react", () => reactModule);
    jest.doMock("react-redux", () => reactReduxModule);
    setEnv("MOCK", "");
    process.env.WALLET_SYNC_ENVIRONMENT = "PROD";
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    server.resetHandlers();
    setEnv("MOCK", originalMockEnv);
    if (originalWalletSyncEnvironment === undefined) {
      delete process.env.WALLET_SYNC_ENVIRONMENT;
    } else {
      process.env.WALLET_SYNC_ENVIRONMENT = originalWalletSyncEnvironment;
    }
  });

  afterAll(() => {
    server.close();
  });

  it("should authenticate when the keypair is a member of the trustchain", async () => {
    const { useTrustchainSdk } = await import("../hooks/useTrustchainSdk");

    const { result } = renderHook(() => useTrustchainSdk(), {
      initialState: withFlagOverrides({
        lldWalletSync: {
          enabled: true,
          params: { watchConfig: {}, learnMoreLink: "" },
        },
      }),
    });

    await expect(
      result.current.withAuth(trustchain, MEMBER_CREDENTIALS, async () => true, "no-cache", true),
    ).resolves.toBe(true);

    expect(endpoints.prodAuthenticate).toHaveBeenCalledTimes(1);
    expect(endpoints.stagingAuthenticate).not.toHaveBeenCalled();
  });

  it("should throw TrustchainEjected when the SDK uses the wrong environment", async () => {
    process.env.WALLET_SYNC_ENVIRONMENT = "STAGING";
    const { useTrustchainSdk } = await import("../hooks/useTrustchainSdk");

    const { result } = renderHook(() => useTrustchainSdk(), {
      initialState: withFlagOverrides({
        lldWalletSync: {
          enabled: true,
          params: { watchConfig: {}, learnMoreLink: "" },
        },
      }),
    });

    await expect(
      result.current.withAuth(trustchain, MEMBER_CREDENTIALS, async () => true, "no-cache", true),
    ).rejects.toMatchObject({
      name: "TrustchainEjected",
      message: "Not a member of trustchain",
    });
  });

  it("should use PROD when walletSyncEnvironment is not set", async () => {
    delete process.env.WALLET_SYNC_ENVIRONMENT;
    const { useTrustchainSdk } = await import("../hooks/useTrustchainSdk");

    const { result } = renderHook(() => useTrustchainSdk());

    await expect(
      result.current.withAuth(trustchain, MEMBER_CREDENTIALS, async () => true, "no-cache", true),
    ).resolves.toBe(true);
  });
});

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}
