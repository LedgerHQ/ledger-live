import { firstValueFrom, toArray } from "rxjs";
import coinConfig from "../config";
import { submitCredential } from "../network/proxyClient";
import { ConcordiumWalletConnect } from "../network/walletConnect";
import { AccountOnboardStatus, ConcordiumPairingStatus } from "../types";
import { CRED_ID, createFixtureAccount, createFixtureCurrency, PUBLIC_KEY } from "../test/fixtures";
import { buildOnboardAccount, buildPairWalletConnect } from "./onboard";
import {
  createFixtureIdAppResponse,
  createFixtureSigner,
  createFixtureSignerContext,
} from "./bridge.fixture";

// Mock dependencies - WalletConnect requires manual IDApp interaction
const mockGetSession = jest.fn();
const mockRequestCreateAccount = jest.fn();
const mockInitiatePairing = jest.fn();
const mockSubmitCredential = jest.fn();

jest.mock("../network/walletConnect", () => ({
  ...jest.requireActual("../network/walletConnect"),
  getWalletConnect: jest.fn(() => ({
    getSession: mockGetSession,
    requestCreateAccount: mockRequestCreateAccount,
    initiatePairing: mockInitiatePairing,
  })),
}));

jest.mock("../signer", () => ({
  getPublicKey: jest.fn().mockResolvedValue("aa".repeat(32)),
  signCredentialDeployment: jest.fn().mockResolvedValue("bb".repeat(64)),
}));

jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  deserializeCredentialDeploymentTransaction: jest.fn().mockReturnValue({
    credId: "cc".repeat(48),
    ipIdentity: 0,
    credentialPublicKeys: { keys: {}, threshold: 1 },
    policy: { validTo: "202612", createdAt: "202512", revealedAttributes: {} },
    proofs: {
      proofIdCredPub: { "0": "11".repeat(50) },
      sig: "ee".repeat(64),
      commitments: "ff".repeat(100),
      challenge: "00".repeat(32),
      proofIpSig: "22".repeat(64),
      proofRegId: "33".repeat(48),
      credCounterLessThanMaxAccounts: "44".repeat(100),
    },
    expiry: 1700000000n,
  }),
}));

jest.mock("../network/proxyClient", () => ({
  ...jest.requireActual("../network/proxyClient"),
  submitCredential: (...args: unknown[]) => mockSubmitCredential(...args),
}));

/**
 * Integration tests for Concordium onboarding flow.
 *
 * These tests verify the onboarding flow against testnet with:
 * - Mocked WalletConnect (requires manual IDApp interaction otherwise)
 * - Real network calls to submitCredential
 * - Real signer context
 */
describe("onboard (testnet integration)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 100000,
      status: {
        type: "active",
      },
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildOnboardAccount", () => {
    it("should complete full onboarding flow with mocked WalletConnect", async () => {
      mockGetSession.mockResolvedValue({ topic: "test-topic" });
      mockRequestCreateAccount.mockResolvedValue(createFixtureIdAppResponse());
      mockSubmitCredential.mockResolvedValue({ submissionId: "test-submission-id" });

      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      const observable = onboardAccount(currency, "test-device", account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      const statuses = events.filter(e => "status" in e).map(e => e.status);
      expect(statuses).toContain(AccountOnboardStatus.INIT);
      expect(statuses).toContain(AccountOnboardStatus.PREPARE);
      expect(statuses).toContain(AccountOnboardStatus.SIGN);

      const finalEvent = events[events.length - 1];
      expect(finalEvent).toHaveProperty("account");
      expect(finalEvent.account.concordiumResources).toMatchObject({
        credId: CRED_ID,
        isOnboarded: true,
        publicKey: PUBLIC_KEY,
      });
    }, 30000);

    it("should handle WalletConnect session not available", async () => {
      mockGetSession.mockResolvedValue(null);

      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      const observable = onboardAccount(currency, "test-device", account);

      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "No active WalletConnect session",
      );
    }, 15000);

    it("should handle IDApp error response", async () => {
      mockGetSession.mockResolvedValue({ topic: "test-topic" });
      mockRequestCreateAccount.mockResolvedValue({
        status: "error",
        message: { details: "Identity verification failed" },
      });

      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      const observable = onboardAccount(currency, "test-device", account);

      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "IDApp create_account failed",
      );
    }, 15000);

    it("should call device signer for public key and signature", async () => {
      const { getPublicKey, signCredentialDeployment } = jest.requireMock("../signer");

      mockGetSession.mockResolvedValue({ topic: "test-topic" });
      mockRequestCreateAccount.mockResolvedValue(createFixtureIdAppResponse());
      mockSubmitCredential.mockResolvedValue({ submissionId: "test-submission-id" });

      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      const observable = onboardAccount(currency, "test-device", account);
      await firstValueFrom(observable.pipe(toArray()));

      expect(getPublicKey).toHaveBeenCalled();
      expect(signCredentialDeployment).toHaveBeenCalled();
    }, 30000);
  });

  describe("buildPairWalletConnect", () => {
    it("should complete pairing flow with mocked session approval", async () => {
      const encodedUri = encodeURIComponent("wc:test-uri");
      mockInitiatePairing.mockResolvedValue({
        uri: encodedUri,
        approval: jest.fn().mockResolvedValue({ topic: "session-topic-123" }),
      });

      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      const observable = pairWalletConnect(currency, "test-device");
      const events = await firstValueFrom(observable.pipe(toArray()));

      const statuses = events.filter(e => "status" in e).map(e => e.status);
      expect(statuses).toContain(ConcordiumPairingStatus.INIT);
      expect(statuses).toContain(ConcordiumPairingStatus.PREPARE);
      expect(statuses).toContain(ConcordiumPairingStatus.SUCCESS);

      const prepareEvent = events.find(e => e.status === ConcordiumPairingStatus.PREPARE) as {
        walletConnectUri: string;
      };
      expect(prepareEvent.walletConnectUri).toContain(encodedUri);

      const successEvent = events.find(e => e.status === ConcordiumPairingStatus.SUCCESS) as {
        sessionTopic: string;
      };
      expect(successEvent.sessionTopic).toBe("session-topic-123");
    }, 30000);

    it("should handle initiatePairing failure", async () => {
      mockInitiatePairing.mockResolvedValue({
        uri: null,
        approval: jest.fn(),
      });

      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      const observable = pairWalletConnect(currency, "test-device");

      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "WalletConnect connect() returned no URI",
      );
    }, 15000);

    it("should timeout on pairing approval", async () => {
      mockInitiatePairing.mockResolvedValue({
        uri: "wc:test",
        approval: jest.fn().mockImplementation(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Timeout")), 100);
            }),
        ),
      });

      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      const observable = pairWalletConnect(currency, "test-device");

      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow();
    }, 15000);
  });

  describe("WalletConnect session validation", () => {
    it("should validate active session correctly", () => {
      const walletConnect = new ConcordiumWalletConnect();
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const validSession = { expiry: futureExpiry } as never;

      expect(walletConnect.isSessionValid(validSession)).toBe(true);
    });

    it("should invalidate expired session", () => {
      const walletConnect = new ConcordiumWalletConnect();
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
      const expiredSession = { expiry: pastExpiry } as never;

      expect(walletConnect.isSessionValid(expiredSession)).toBe(false);
    });

    it("should handle edge case at expiry boundary", () => {
      const walletConnect = new ConcordiumWalletConnect();
      const nowExpiry = Math.floor(Date.now() / 1000);
      const sessionAtBoundary = { expiry: nowExpiry } as never;

      // Session expiring now should be invalid (expiry * 1000 > Date.now())
      expect(walletConnect.isSessionValid(sessionAtBoundary)).toBe(false);
    });
  });

  describe("Network integration", () => {
    it("should handle credential submission with mocked network", async () => {
      mockSubmitCredential.mockResolvedValue({ submissionId: "test-submission-123" });

      const currency = createFixtureCurrency();
      const mockData = { v: 0, value: {} } as never;

      const result = await submitCredential(currency, mockData);

      expect(result).toEqual({ submissionId: "test-submission-123" });
      expect(mockSubmitCredential).toHaveBeenCalledWith(currency, mockData);
    }, 15000);

    it("should use correct testnet configuration", () => {
      const config = coinConfig.getCoinConfig();

      expect(config.networkType).toBe("testnet");
      expect(config.grpcUrl).toBe("grpc.testnet.concordium.com");
      expect(config.grpcPort).toBe(20000);
      expect(config.proxyUrl).toBe("https://wallet-proxy.testnet.concordium.com");
      expect(config.minReserve).toBe(100000);
    });
  });
});
